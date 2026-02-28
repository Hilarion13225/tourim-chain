'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { filterMockSites } from '@/lib/mock-tourism-data';

const USE_MOCK_DATA = true;

type Site = {
  id: string;
  nom: string;
  region: string;
  description: string;
  categorieTourisme: string;
};

export default function ExplorerPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [categorie, setCategorie] = useState('');
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [loadingSiteId, setLoadingSiteId] = useState<string | null>(null);

  async function loadSites() {
    setIsLoading(true);
    setError('');

    if (USE_MOCK_DATA) {
      const filtered = filterMockSites({ query, region, categorie });
      setSites(filtered);
      setIsLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();

      if (query) {
        params.set('q', query);
      }

      if (region) {
        params.set('region', region);
      }

      if (categorie) {
        params.set('categorie', categorie);
      }

      const response = await fetch(`/api/sites?${params.toString()}`);
      const data = (await response.json()) as Site[] | { error?: string };

      if (!response.ok) {
        setError((data as { error?: string }).error ?? 'Erreur de chargement');
        setSites([]);
        return;
      }

      setSites(data as Site[]);
    } catch {
      setError('Erreur réseau, veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }

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

    void loadSites();
    void loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadSites();
  }

  async function handleReserve(siteId: string) {
    setActionError('');
    setActionSuccess('');

    if (!sessionUserId) {
      router.push('/login');
      return;
    }

    setLoadingSiteId(siteId);

    if (USE_MOCK_DATA) {
      setActionSuccess(`Réservation démo confirmée (#DEMO-${siteId}).`);
      setLoadingSiteId(null);
      return;
    }

    try {
      const response = await fetch('/api/bookings/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, participants: 1 }),
      });

      const data = (await response.json()) as {
        error?: string;
        booking?: { id?: string };
      };

      if (!response.ok) {
        setActionError(data.error ?? 'Réservation impossible');
        return;
      }

      setActionSuccess(
        `Réservation confirmée (#${data.booking?.id ?? 'N/A'}).`,
      );
    } catch {
      setActionError('Erreur réseau pendant la réservation.');
    } finally {
      setLoadingSiteId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Explorer la Côte d’Ivoire</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Découvrez les lieux incontournables de Côte d’Ivoire, filtrés par
          région et type d’expérience.
        </p>
      </header>

      <form
        onSubmit={handleSearch}
        className="grid gap-3 rounded-2xl border border-black/10 p-4 dark:border-white/15 md:grid-cols-4"
      >
        <input
          className="rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          placeholder="Rechercher un site"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <input
          className="rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          placeholder="Région"
          value={region}
          onChange={(event) => setRegion(event.target.value)}
        />
        <input
          className="rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          placeholder="Catégorie (CULTURE, NATURE...)"
          value={categorie}
          onChange={(event) => setCategorie(event.target.value.toUpperCase())}
        />
        <button className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background">
          Appliquer
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {actionError ? (
        <p className="text-sm text-red-600">{actionError}</p>
      ) : null}
      {actionSuccess ? (
        <p className="text-sm text-emerald-600">{actionSuccess}</p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-zinc-500">Chargement des sites...</p>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sites.map((site) => (
            <article
              key={site.id}
              className="space-y-3 rounded-2xl border border-black/10 p-4 dark:border-white/15"
            >
              <div className="h-32 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
              <h2 className="font-semibold">{site.nom}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {site.region}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span>{site.categorieTourisme}</span>
              </div>
              <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                {site.description}
              </p>
              <button
                onClick={() => void handleReserve(site.id)}
                className="rounded-full bg-foreground px-3 py-1.5 text-xs text-background disabled:opacity-60"
                disabled={loadingSiteId === site.id}
              >
                {loadingSiteId === site.id ? 'Réservation...' : 'Réserver'}
              </button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
