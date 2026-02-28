'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type TourismCategory =
  | 'CULTUREL'
  | 'BALNEAIRE'
  | 'ECOTOURISME'
  | 'URBAIN_EVENT';

type TourismActivity = {
  id: string;
  titre: string;
  category: TourismCategory;
  region: string;
  prixXof: number;
  dureeHeures: number;
  resume: string;
};

const activities: TourismActivity[] = [
  {
    id: 'act-1',
    titre: 'Circuit Patrimoine de Grand-Bassam',
    category: 'CULTUREL',
    region: 'Sud-Comoé',
    prixXof: 18000,
    dureeHeures: 4,
    resume:
      'Visite guidée du patrimoine historique, artisanat local et immersion culturelle.',
  },
  {
    id: 'act-2',
    titre: 'Atelier masques et danses traditionnelles',
    category: 'CULTUREL',
    region: 'Abidjan',
    prixXof: 14000,
    dureeHeures: 3,
    resume:
      'Découverte des arts traditionnels ivoiriens avec initiation pratique.',
  },
  {
    id: 'act-3',
    titre: 'Journée détente à Assinie',
    category: 'BALNEAIRE',
    region: 'Lagunes',
    prixXof: 29000,
    dureeHeures: 8,
    resume: 'Plages, sports nautiques et déjeuner en bord de mer.',
  },
  {
    id: 'act-4',
    titre: 'Excursion premium Grand-Béréby',
    category: 'BALNEAIRE',
    region: 'Bas-Sassandra',
    prixXof: 32000,
    dureeHeures: 10,
    resume: 'Escapade balnéaire avec baignade, bateau et détente tropicale.',
  },
  {
    id: 'act-5',
    titre: 'Safari responsable au Parc de Taï',
    category: 'ECOTOURISME',
    region: 'Bas-Sassandra',
    prixXof: 26000,
    dureeHeures: 7,
    resume:
      'Observation de la biodiversité avec guide certifié et approche durable.',
  },
  {
    id: 'act-6',
    titre: 'Randonnée nature au Parc de la Comoé',
    category: 'ECOTOURISME',
    region: 'Zanzan',
    prixXof: 21000,
    dureeHeures: 6,
    resume:
      'Parcours écotouristique entre savane, faune et sensibilisation environnementale.',
  },
  {
    id: 'act-7',
    titre: 'Abidjan by night & gastronomie',
    category: 'URBAIN_EVENT',
    region: 'Abidjan',
    prixXof: 24000,
    dureeHeures: 5,
    resume:
      'Soirée urbaine avec spots culinaires, musique live et lieux emblématiques.',
  },
  {
    id: 'act-8',
    titre: 'Pack festival urbain (FEMUA)',
    category: 'URBAIN_EVENT',
    region: 'Abidjan',
    prixXof: 35000,
    dureeHeures: 9,
    resume: 'Accès festival, navette et accompagnement événementiel.',
  },
];

const categoryMeta: Record<TourismCategory, { label: string; hint: string }> = {
  CULTUREL: {
    label: 'Tourisme culturel',
    hint: 'Patrimoines, arts, festivals, traditions',
  },
  BALNEAIRE: {
    label: 'Tourisme balnéaire',
    hint: 'Plages, détente, loisirs nautiques',
  },
  ECOTOURISME: {
    label: 'Écotourisme',
    hint: 'Nature, parcs, biodiversité durable',
  },
  URBAIN_EVENT: {
    label: 'Tourisme urbain & événementiel',
    hint: 'Ville, nightlife, concerts, business',
  },
};

const regions = [
  'Toutes',
  'Abidjan',
  'Sud-Comoé',
  'Lagunes',
  'Bas-Sassandra',
  'Zanzan',
];

function formatPrix(prixXof: number) {
  return `${new Intl.NumberFormat('fr-FR').format(prixXof)} XOF`;
}

export default function TourismePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<
    TourismCategory[]
  >(['CULTUREL', 'BALNEAIRE', 'ECOTOURISME', 'URBAIN_EVENT']);
  const [region, setRegion] = useState('Toutes');
  const [budgetMax, setBudgetMax] = useState(40000);
  const [dureeMax, setDureeMax] = useState(12);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [reserveError, setReserveError] = useState('');
  const [reserveMessage, setReserveMessage] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  function toggleCategory(category: TourismCategory) {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        const next = current.filter((value) => value !== category);
        return next.length > 0 ? next : current;
      }

      return [...current, category];
    });
  }

  function resetFilters() {
    setQuery('');
    setSelectedCategories([
      'CULTUREL',
      'BALNEAIRE',
      'ECOTOURISME',
      'URBAIN_EVENT',
    ]);
    setRegion('Toutes');
    setBudgetMax(40000);
    setDureeMax(12);
  }

  const filteredActivities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return activities.filter((activity) => {
      const matchesQuery =
        !normalizedQuery ||
        `${activity.titre} ${activity.resume} ${activity.region}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCategory = selectedCategories.includes(activity.category);
      const matchesRegion =
        region === 'Toutes' ? true : activity.region === region;
      const matchesBudget = activity.prixXof <= budgetMax;
      const matchesDuration = activity.dureeHeures <= dureeMax;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesRegion &&
        matchesBudget &&
        matchesDuration
      );
    });
  }, [query, selectedCategories, region, budgetMax, dureeMax]);

  async function handleReserve(activityId: string) {
    setReserveError('');
    setReserveMessage('');

    if (!sessionUserId) {
      router.push('/login');
      return;
    }

    setLoadingId(activityId);

    try {
      const activity = activities.find((item) => item.id === activityId);

      const response = await fetch('/api/tourist-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'TOURISM_ACTIVITY',
          itemId: activityId,
          itemLabel: activity?.titre ?? activityId,
          amount: activity?.prixXof ?? 10000,
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

        setReserveError(data.error ?? 'Réservation impossible.');
        return;
      }

      setReserveMessage(
        `${data.message ?? 'Réservation confirmée.'} Réf: ${data.reference ?? 'N/A'}`,
      );
    } catch {
      setReserveError('Erreur réseau pendant la réservation.');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold">Tourisme</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Recherchez et réservez vos activités dans les 4 catégories du tourisme
          ivoirien.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-5 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Recherche
            </h2>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom, région, activité..."
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Catégories
            </h2>
            {(Object.keys(categoryMeta) as TourismCategory[]).map(
              (category) => (
                <label
                  key={category}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 p-3 dark:border-white/15"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-semibold">
                      {categoryMeta[category].label}
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {categoryMeta[category].hint}
                    </span>
                  </span>
                </label>
              ),
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Région
            </h2>
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            >
              {regions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Budget max ({formatPrix(budgetMax)})
            </h2>
            <input
              type="range"
              min={10000}
              max={40000}
              step={1000}
              value={budgetMax}
              onChange={(event) => setBudgetMax(Number(event.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Durée max ({dureeMax}h)
            </h2>
            <input
              type="range"
              min={2}
              max={12}
              step={1}
              value={dureeMax}
              onChange={(event) => setDureeMax(Number(event.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={resetFilters}
            className="w-full rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-white/15 dark:hover:bg-white/5"
          >
            Réinitialiser les filtres
          </button>
        </aside>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {filteredActivities.length} activité(s) trouvée(s)
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Réservation instantanée (démo) avec redirection connexion si
              nécessaire.
            </p>
          </div>

          {reserveError ? (
            <p className="text-sm text-red-600">{reserveError}</p>
          ) : null}
          {reserveMessage ? (
            <p className="text-sm text-emerald-600">{reserveMessage}</p>
          ) : null}

          {filteredActivities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/20 p-6 text-sm text-zinc-500 dark:border-white/20 dark:text-zinc-400">
              Aucun résultat avec ces filtres. Ajustez votre recherche ou votre
              budget.
            </div>
          ) : (
            <section className="grid gap-4 md:grid-cols-2">
              {filteredActivities.map((activity) => (
                <article
                  key={activity.id}
                  className="space-y-3 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold">{activity.titre}</h2>
                    <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:bg-orange-500/20 dark:text-orange-300">
                      {categoryMeta[activity.category].label}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {activity.resume}
                  </p>
                  <div className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-3">
                    <span>📍 {activity.region}</span>
                    <span>⏱️ {activity.dureeHeures}h</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {formatPrix(activity.prixXof)}
                    </span>
                  </div>
                  <button
                    onClick={() => void handleReserve(activity.id)}
                    disabled={loadingId === activity.id}
                    className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                  >
                    {loadingId === activity.id
                      ? 'Réservation...'
                      : 'Réserver cette activité'}
                  </button>
                </article>
              ))}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
