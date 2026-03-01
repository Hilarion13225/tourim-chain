'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type SportView = 'ACTIVITES' | 'EVENEMENTS';
type SportType = string;

type SportActivity = {
  id: string;
  titre: string;
  ville: string;
  type: SportType;
  prix: number;
  dureeHeures: number;
  intensity: 1 | 2 | 3 | 4 | 5;
  photoUrl?: string | null;
};

type SportEvent = {
  id: string;
  titre: string;
  ville: string;
  type: SportType;
  prixTicket: number;
  niveau: 'Débutant' | 'Intermédiaire' | 'Avancé';
  date: string;
  photoUrl?: string | null;
};

type ApiEvent = {
  id: string;
  nom: string;
  photoUrl?: string | null;
  description: string;
  lieu: string;
  startAt: string;
  ticketTypes?: Array<{
    id: string;
    prix: string;
  }>;
};

type OrganizerMeta = {
  itemType?: 'ACTIVITY' | 'EVENT';
  category?: string;
  intensity?: number;
  durationHours?: number;
  level?: 'Débutant' | 'Intermédiaire' | 'Avancé';
  ticketPrice?: number;
};

function parseOrganizerMeta(description: string): OrganizerMeta {
  if (!description.startsWith('__ORG_META__')) {
    return {};
  }

  const firstLineBreak = description.indexOf('\n');
  const metaLine =
    firstLineBreak >= 0 ? description.slice(0, firstLineBreak) : description;
  const rawJson = metaLine.replace('__ORG_META__', '');

  try {
    return JSON.parse(rawJson) as OrganizerMeta;
  } catch {
    return {};
  }
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR');
}

export default function SportPage() {
  const router = useRouter();

  const [activities, setActivities] = useState<SportActivity[]>([]);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');
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

    async function loadSportData() {
      setDataLoading(true);
      setDataError('');

      try {
        const response = await fetch('/api/events?status=PUBLISHED');
        const data = (await response.json()) as ApiEvent[] | { error?: string };

        if (!response.ok) {
          setDataError(
            (data as { error?: string }).error ??
              'Erreur de chargement des activités sportives.',
          );
          setActivities([]);
          setEvents([]);
          return;
        }

        const normalizedActivities: SportActivity[] = [];
        const normalizedEvents: SportEvent[] = [];

        for (const item of data as ApiEvent[]) {
          const meta = parseOrganizerMeta(item.description);
          const ticketPrice = Number(
            item.ticketTypes?.[0]?.prix ?? meta.ticketPrice ?? 0,
          );

          if (meta.itemType === 'ACTIVITY') {
            normalizedActivities.push({
              id: item.id,
              titre: item.nom,
              ville: item.lieu,
              type: meta.category ?? 'Outdoor',
              prix: ticketPrice || 38000,
              dureeHeures: Math.max(1, Math.floor(meta.durationHours ?? 4)),
              intensity: Math.min(
                5,
                Math.max(1, Math.floor(meta.intensity ?? 3)),
              ) as 1 | 2 | 3 | 4 | 5,
              photoUrl: item.photoUrl,
            });
            continue;
          }

          normalizedEvents.push({
            id: item.id,
            titre: item.nom,
            ville: item.lieu,
            type: meta.category ?? 'Outdoor',
            prixTicket: ticketPrice || 12000,
            niveau: meta.level ?? 'Intermédiaire',
            date: formatDate(item.startAt),
            photoUrl: item.photoUrl,
          });
        }

        setActivities(normalizedActivities);
        setEvents(normalizedEvents);
      } catch {
        setDataError('Erreur réseau pendant le chargement des données sport.');
        setActivities([]);
        setEvents([]);
      } finally {
        setDataLoading(false);
      }
    }

    void loadSession();
    void loadSportData();
  }, []);

  const availableCities = useMemo(() => {
    const source = view === 'ACTIVITES' ? activities : events;
    return ['Toutes', ...new Set(source.map((item) => item.ville))];
  }, [view, activities, events]);

  const availableSportTypes = useMemo(() => {
    const source = view === 'ACTIVITES' ? activities : events;
    return ['Tous', ...new Set(source.map((item) => item.type))];
  }, [view, activities, events]);

  const filteredActivities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return activities.filter((item) => {
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
  }, [activities, query, ville, sportType, budgetMax, intensityMax, maxDuree]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((item) => {
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
  }, [events, query, ville, sportType, budgetMax, niveau]);

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

    if (view === 'ACTIVITES') {
      setLoadingId(itemId);
      router.push(`/sport/activite/${itemId}`);
      return;
    }

    if (!sessionUserId) {
      router.push('/login');
      return;
    }

    setLoadingId(itemId);
    router.push(`/sport/evenement/${itemId}`);
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
              {availableSportTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
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
          {dataError ? (
            <p className="text-sm text-red-600">{dataError}</p>
          ) : null}
          {actionError ? (
            <p className="text-sm text-red-600">{actionError}</p>
          ) : null}
          {feedback ? (
            <p className="text-sm text-emerald-600">{feedback}</p>
          ) : null}
          {dataLoading ? (
            <p className="text-sm text-zinc-500">
              Chargement des données sport...
            </p>
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
                    {item.photoUrl ? (
                      <div className="relative h-36 w-full overflow-hidden rounded-xl">
                        <Image
                          src={item.photoUrl}
                          alt={item.titre}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    ) : null}
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
                    {item.photoUrl ? (
                      <div className="relative h-36 w-full overflow-hidden rounded-xl">
                        <Image
                          src={item.photoUrl}
                          alt={item.titre}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    ) : null}
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
