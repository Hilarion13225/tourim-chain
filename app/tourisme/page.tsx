'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type TourismType = 'CULTUREL' | 'BALNEAIRE' | 'ECOTOURISME' | 'URBAN';
type TourismFilterType = 'TOUS' | TourismType;
type SortType =
  | 'RECENT'
  | 'PRIX_ASC'
  | 'PRIX_DESC'
  | 'DUREE_ASC'
  | 'DUREE_DESC'
  | 'NOM_ASC';

type ApiSite = {
  id: string;
  nom: string;
  region: string;
  description: string;
  categorieTourisme: string;
  medias?: Array<{
    id: string;
    url: string;
    type: string;
  }>;
};

type TourismSite = {
  id: string;
  nom: string;
  region: string;
  type: TourismType;
  typeLabel: string;
  summary: string;
  priceXof: number;
  durationHours: number;
  photoUrl?: string | null;
};

function formatXof(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} XOF`;
}

function mapCategoryToType(category: string): TourismType {
  switch (category) {
    case 'CULTURE':
    case 'HERITAGE':
    case 'RELIGIOUS':
      return 'CULTUREL';
    case 'BEACH':
      return 'BALNEAIRE';
    case 'NATURE':
      return 'ECOTOURISME';
    default:
      return 'URBAN';
  }
}

function typeLabel(type: TourismType) {
  switch (type) {
    case 'CULTUREL':
      return 'Culturel';
    case 'BALNEAIRE':
      return 'Balnéaire';
    case 'ECOTOURISME':
      return 'Écotourisme';
    case 'URBAN':
      return 'Urban';
  }
}

function parseTourismMeta(description: string) {
  const fallback = {
    summary: description,
    priceXof: 15000,
    durationHours: 4,
  };

  if (!description.startsWith('__TOURISM_META__')) {
    return fallback;
  }

  const firstLineBreak = description.indexOf('\n');
  const metaLine =
    firstLineBreak >= 0 ? description.slice(0, firstLineBreak) : description;
  const rawJson = metaLine.replace('__TOURISM_META__', '');
  const summary =
    firstLineBreak >= 0 ? description.slice(firstLineBreak + 1) : '';

  try {
    const parsed = JSON.parse(rawJson) as {
      priceXof?: number;
      durationHours?: number;
    };

    return {
      summary: summary || fallback.summary,
      priceXof: Number(parsed.priceXof ?? fallback.priceXof),
      durationHours: Number(parsed.durationHours ?? fallback.durationHours),
    };
  } catch {
    return fallback;
  }
}

export default function TourismePage() {
  const router = useRouter();
  const [sites, setSites] = useState<TourismSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [sitesError, setSitesError] = useState('');
  const [tourismType, setTourismType] = useState<TourismFilterType>('TOUS');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('Toutes');
  const [budgetMax, setBudgetMax] = useState(80000);
  const [durationMax, setDurationMax] = useState(12);
  const [sortType, setSortType] = useState<SortType>('RECENT');

  useEffect(() => {
    async function loadSites() {
      setLoading(true);

      try {
        const response = await fetch('/api/sites');
        const data = (await response.json()) as ApiSite[] | { error?: string };

        if (!response.ok) {
          setSitesError(
            (data as { error?: string }).error ?? 'Erreur chargement tourisme.',
          );
          setSites([]);
          return;
        }

        const normalized = (data as ApiSite[]).map((item) => {
          const meta = parseTourismMeta(item.description);
          const mappedType = mapCategoryToType(item.categorieTourisme);
          const imageMedia = item.medias?.find(
            (media) => media.type === 'IMAGE',
          );

          return {
            id: item.id,
            nom: item.nom,
            region: item.region,
            type: mappedType,
            typeLabel: typeLabel(mappedType),
            summary: meta.summary,
            priceXof: Number.isFinite(meta.priceXof) ? meta.priceXof : 15000,
            durationHours: Number.isFinite(meta.durationHours)
              ? meta.durationHours
              : 4,
            photoUrl: imageMedia?.url,
          } as TourismSite;
        });

        setSites(normalized);
        setSitesError('');
      } catch {
        setSitesError('Erreur chargement tourisme.');
        setSites([]);
      } finally {
        setLoading(false);
      }
    }

    void loadSites();
  }, []);

  const availableRegions = useMemo(() => {
    const scoped =
      tourismType === 'TOUS'
        ? sites
        : sites.filter((item) => item.type === tourismType);
    return ['Toutes', ...new Set(scoped.map((item) => item.region))];
  }, [sites, tourismType]);

  const filteredSites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const scoped =
      tourismType === 'TOUS'
        ? sites
        : sites.filter((item) => item.type === tourismType);
    const filtered = scoped.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        `${item.nom} ${item.region} ${item.summary} ${item.typeLabel}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesRegion = region === 'Toutes' ? true : item.region === region;
      const matchesBudget = item.priceXof <= budgetMax;
      const matchesDuration = item.durationHours <= durationMax;

      return matchesQuery && matchesRegion && matchesBudget && matchesDuration;
    });

    const sorted = [...filtered];

    switch (sortType) {
      case 'PRIX_ASC':
        sorted.sort((a, b) => a.priceXof - b.priceXof);
        break;
      case 'PRIX_DESC':
        sorted.sort((a, b) => b.priceXof - a.priceXof);
        break;
      case 'DUREE_ASC':
        sorted.sort((a, b) => a.durationHours - b.durationHours);
        break;
      case 'DUREE_DESC':
        sorted.sort((a, b) => b.durationHours - a.durationHours);
        break;
      case 'NOM_ASC':
        sorted.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
        break;
      default:
        break;
    }

    return sorted;
  }, [sites, tourismType, query, region, budgetMax, durationMax, sortType]);

  function switchType(nextType: TourismFilterType) {
    setTourismType(nextType);
    setQuery('');
    setRegion('Toutes');
    setBudgetMax(80000);
    setDurationMax(12);
    setSortType('RECENT');
  }

  function handleBook(itemId: string) {
    router.push(`/tourisme/${itemId}`);
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold">Tourisme</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Filtrez, triez et réservez des expériences touristiques en Côte
          d’Ivoire.
        </p>
      </header>

      <section className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => switchType('TOUS')}
            className={
              tourismType === 'TOUS'
                ? 'rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/15'
            }
          >
            Tous
          </button>
          <button
            onClick={() => switchType('CULTUREL')}
            className={
              tourismType === 'CULTUREL'
                ? 'rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/15'
            }
          >
            Culturel
          </button>
          <button
            onClick={() => switchType('BALNEAIRE')}
            className={
              tourismType === 'BALNEAIRE'
                ? 'rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/15'
            }
          >
            Balnéaire
          </button>
          <button
            onClick={() => switchType('ECOTOURISME')}
            className={
              tourismType === 'ECOTOURISME'
                ? 'rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/15'
            }
          >
            Écotourisme
          </button>
          <button
            onClick={() => switchType('URBAN')}
            className={
              tourismType === 'URBAN'
                ? 'rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/15'
            }
          >
            Urban
          </button>
          <button
            onClick={() => router.push('/login')}
            className="ml-auto rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/15"
          >
            Se connecter
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Filtres
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-medium">Recherche</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom, région, description..."
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Région</label>
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            >
              {availableRegions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Budget max ({formatXof(budgetMax)})
            </label>
            <input
              type="range"
              min={5000}
              max={80000}
              step={1000}
              value={budgetMax}
              onChange={(event) => setBudgetMax(Number(event.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Durée max ({durationMax}h)
            </label>
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={durationMax}
              onChange={(event) => setDurationMax(Number(event.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tri</label>
            <select
              value={sortType}
              onChange={(event) => setSortType(event.target.value as SortType)}
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            >
              <option value="RECENT">Plus récent</option>
              <option value="PRIX_ASC">Prix croissant</option>
              <option value="PRIX_DESC">Prix décroissant</option>
              <option value="DUREE_ASC">Durée croissante</option>
              <option value="DUREE_DESC">Durée décroissante</option>
              <option value="NOM_ASC">Nom A-Z</option>
            </select>
          </div>
        </aside>

        <div className="space-y-4">
          {sitesError ? (
            <p className="text-sm text-red-600">{sitesError}</p>
          ) : null}
          {loading ? (
            <p className="text-sm text-zinc-500">Chargement des activités...</p>
          ) : null}

          {!loading ? (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {filteredSites.length} activité(s) trouvée(s)
              </p>
              <section className="grid gap-4 md:grid-cols-2">
                {filteredSites.map((item) => (
                  <article
                    key={item.id}
                    className="space-y-3 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900"
                  >
                    {item.photoUrl ? (
                      <div className="relative h-40 w-full overflow-hidden rounded-xl">
                        <Image
                          src={item.photoUrl}
                          alt={item.nom}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center rounded-xl bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                        Aucune image
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-semibold">{item.nom}</h2>
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold dark:bg-zinc-800">
                        {item.typeLabel}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      📍 {item.region}
                    </p>
                    <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {item.summary}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      Durée {item.durationHours}h
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {formatXof(item.priceXof)}
                      </p>
                      <button
                        onClick={() => handleBook(item.id)}
                        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                      >
                        Réserver cette activité
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
