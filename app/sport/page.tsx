'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type SportView = 'ACTIVITES' | 'EVENEMENTS';
type SportType = 'Nautique' | 'Randonnée' | 'Cyclisme' | 'Fitness' | 'Outdoor';

type SportActivity = {
  id: string;
  titre: string;
  ville: string;
  type: SportType;
  prix: number;
  dureeHeures: number;
  intensity: 1 | 2 | 3 | 4 | 5;
};

type SportEvent = {
  id: string;
  titre: string;
  ville: string;
  type: SportType;
  prixTicket: number;
  niveau: 'Débutant' | 'Intermédiaire' | 'Avancé';
  date: string;
};

const sportActivities: SportActivity[] = [
  {
    id: 'sa-1',
    titre: 'Surf & Jet-ski à Assinie',
    ville: 'Assinie',
    type: 'Nautique',
    prix: 38000,
    dureeHeures: 4,
    intensity: 4,
  },
  {
    id: 'sa-2',
    titre: 'Randonnée guidée Mont Tonkpi',
    ville: 'Man',
    type: 'Randonnée',
    prix: 22000,
    dureeHeures: 6,
    intensity: 3,
  },
  {
    id: 'sa-3',
    titre: 'Cyclisme urbain by night',
    ville: 'Abidjan',
    type: 'Cyclisme',
    prix: 14000,
    dureeHeures: 2,
    intensity: 2,
  },
  {
    id: 'sa-4',
    titre: 'Bootcamp plage Grand-Bassam',
    ville: 'Grand-Bassam',
    type: 'Fitness',
    prix: 16000,
    dureeHeures: 2,
    intensity: 5,
  },
];

const sportEvents: SportEvent[] = [
  {
    id: 'se-1',
    titre: 'Trail Nature Taï Challenge',
    ville: 'Taï',
    type: 'Outdoor',
    prixTicket: 12000,
    niveau: 'Intermédiaire',
    date: '12/04/2026',
  },
  {
    id: 'se-2',
    titre: 'Tour cycliste d’Abidjan',
    ville: 'Abidjan',
    type: 'Cyclisme',
    prixTicket: 9000,
    niveau: 'Débutant',
    date: '19/04/2026',
  },
  {
    id: 'se-3',
    titre: 'Open nautique Assinie',
    ville: 'Assinie',
    type: 'Nautique',
    prixTicket: 15000,
    niveau: 'Avancé',
    date: '03/05/2026',
  },
  {
    id: 'se-4',
    titre: 'Marche sportive de Yamoussoukro',
    ville: 'Yamoussoukro',
    type: 'Randonnée',
    prixTicket: 7000,
    niveau: 'Débutant',
    date: '10/05/2026',
  },
];

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;
}

export default function SportPage() {
  const router = useRouter();

  const [view, setView] = useState<SportView>('ACTIVITES');
  const [query, setQuery] = useState('');
  const [ville, setVille] = useState('Toutes');
  const [sportType, setSportType] = useState<'Tous' | SportType>('Tous');
  const [budgetMax, setBudgetMax] = useState(40000);
  const [intensityMax, setIntensityMax] = useState(5);
  const [maxDuree, setMaxDuree] = useState(8);
  const [niveau, setNiveau] = useState<'Tous' | SportEvent['niveau']>('Tous');
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch('/api/auth/me');

        if (!response.ok) {
          setSessionUserId(null);
          return;
        }

        const data = (await response.json()) as { user?: { id?: string } };
        setSessionUserId(data.user?.id ?? null);
      } catch {
        setSessionUserId(null);
      }
    }

    void loadSession();
  }, []);

  const availableCities = useMemo(() => {
    const source = view === 'ACTIVITES' ? sportActivities : sportEvents;
    return ['Toutes', ...new Set(source.map((item) => item.ville))];
  }, [view]);

  const filteredActivities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sportActivities.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        `${item.titre} ${item.ville} ${item.type}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesVille = ville === 'Toutes' ? true : item.ville === ville;
      const matchesType = sportType === 'Tous' ? true : item.type === sportType;
      const matchesBudget = item.prix <= budgetMax;
      const matchesIntensity = item.intensity <= intensityMax;
      const matchesDuration = item.dureeHeures <= maxDuree;

      return (
        matchesQuery &&
        matchesVille &&
        matchesType &&
        matchesBudget &&
        matchesIntensity &&
        matchesDuration
      );
    });
  }, [query, ville, sportType, budgetMax, intensityMax, maxDuree]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sportEvents.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        `${item.titre} ${item.ville} ${item.type}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesVille = ville === 'Toutes' ? true : item.ville === ville;
      const matchesType = sportType === 'Tous' ? true : item.type === sportType;
      const matchesBudget = item.prixTicket <= budgetMax;
      const matchesNiveau = niveau === 'Tous' ? true : item.niveau === niveau;

      return (
        matchesQuery &&
        matchesVille &&
        matchesType &&
        matchesBudget &&
        matchesNiveau
      );
    });
  }, [query, ville, sportType, budgetMax, niveau]);

  function switchView(next: SportView) {
    setView(next);
    setQuery('');
    setVille('Toutes');
    setSportType('Tous');
    setBudgetMax(next === 'ACTIVITES' ? 40000 : 20000);
    setIntensityMax(5);
    setMaxDuree(8);
    setNiveau('Tous');
    setActionError('');
    setFeedback('');
  }

  async function handleAction(itemId: string) {
    setActionError('');
    setFeedback('');

    if (!sessionUserId) {
      router.push('/login');
      return;
    }

    setLoadingId(itemId);

    const activity = sportActivities.find((item) => item.id === itemId);
    const eventItem = sportEvents.find((item) => item.id === itemId);

    const actionType = view === 'ACTIVITES' ? 'SPORT_ACTIVITY' : 'SPORT_EVENT';
    const itemLabel = activity?.titre ?? eventItem?.titre ?? itemId;
    const amount = activity?.prix ?? eventItem?.prixTicket ?? 1000;

    try {
      const response = await fetch('/api/tourist-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType,
          itemId,
          itemLabel,
          amount,
          participants: 1,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        reference?: string;
      };

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }

        setActionError(data.error ?? 'Action impossible.');
        return;
      }

      setFeedback(
        `${data.message ?? 'Action confirmée.'} Réf: ${data.reference ?? 'N/A'}`,
      );
    } catch {
      setActionError('Erreur réseau pendant l’action.');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold">Sport</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Filtrez et réservez des activités sportives ou inscrivez-vous à des
          événements outdoor.
        </p>
      </header>

      <section className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => switchView('ACTIVITES')}
            className={
              view === 'ACTIVITES'
                ? 'rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/15'
            }
          >
            Activités
          </button>
          <button
            onClick={() => switchView('EVENEMENTS')}
            className={
              view === 'EVENEMENTS'
                ? 'rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/15'
            }
          >
            Événements
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Filtres sport
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-medium">Recherche</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Activité, ville, type..."
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ville</label>
            <select
              value={ville}
              onChange={(event) => setVille(event.target.value)}
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            >
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Type de sport</label>
            <select
              value={sportType}
              onChange={(event) =>
                setSportType(event.target.value as 'Tous' | SportType)
              }
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            >
              <option value="Tous">Tous</option>
              <option value="Nautique">Nautique</option>
              <option value="Randonnée">Randonnée</option>
              <option value="Cyclisme">Cyclisme</option>
              <option value="Fitness">Fitness</option>
              <option value="Outdoor">Outdoor</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Budget max ({formatMoney(budgetMax)})
            </label>
            <input
              type="range"
              min={5000}
              max={view === 'ACTIVITES' ? 40000 : 20000}
              step={1000}
              value={budgetMax}
              onChange={(event) => setBudgetMax(Number(event.target.value))}
              className="w-full"
            />
          </div>

          {view === 'ACTIVITES' ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Intensité max ({intensityMax}/5)
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={intensityMax}
                  onChange={(event) =>
                    setIntensityMax(Number(event.target.value))
                  }
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Durée max ({maxDuree}h)
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={maxDuree}
                  onChange={(event) => setMaxDuree(Number(event.target.value))}
                  className="w-full"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Niveau</label>
              <select
                value={niveau}
                onChange={(event) =>
                  setNiveau(event.target.value as 'Tous' | SportEvent['niveau'])
                }
                className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              >
                <option value="Tous">Tous</option>
                <option value="Débutant">Débutant</option>
                <option value="Intermédiaire">Intermédiaire</option>
                <option value="Avancé">Avancé</option>
              </select>
            </div>
          )}
        </aside>

        <div className="space-y-4">
          {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
          {feedback ? (
            <p className="text-sm text-emerald-600">{feedback}</p>
          ) : null}

          {view === 'ACTIVITES' ? (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {filteredActivities.length} activité(s) trouvée(s)
              </p>
              <section className="grid gap-4 md:grid-cols-2">
                {filteredActivities.map((item) => (
                  <article
                    key={item.id}
                    className="space-y-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900"
                  >
                    <h2 className="text-lg font-semibold">{item.titre}</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      📍 {item.ville} • {item.type}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      Intensité {item.intensity}/5 • Durée {item.dureeHeures}h
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {formatMoney(item.prix)}
                      </p>
                      <button
                        onClick={() => handleAction(item.id)}
                        disabled={loadingId === item.id}
                        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                      >
                        {loadingId === item.id ? 'Réservation...' : 'Réserver'}
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            </>
          ) : (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {filteredEvents.length} événement(s) trouvé(s)
              </p>
              <section className="grid gap-4 md:grid-cols-2">
                {filteredEvents.map((item) => (
                  <article
                    key={item.id}
                    className="space-y-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900"
                  >
                    <h2 className="text-lg font-semibold">{item.titre}</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      📍 {item.ville} • {item.type}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      Date: {item.date} • Niveau: {item.niveau}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        Ticket {formatMoney(item.prixTicket)}
                      </p>
                      <button
                        onClick={() => handleAction(item.id)}
                        disabled={loadingId === item.id}
                        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                      >
                        {loadingId === item.id
                          ? 'Inscription...'
                          : 'S’inscrire'}
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
