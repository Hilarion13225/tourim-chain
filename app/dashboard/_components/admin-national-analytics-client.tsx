'use client';

import { useEffect, useMemo, useState } from 'react';

type AnalyticsPayload = {
  overview: {
    totalUsers: number;
    totalSites: number;
    totalEvents: number;
    totalBookings: number;
    totalProducts: number;
    unverifiedActors: number;
  };
  actorsByRole: {
    tourists: number;
    guides: number;
    artisans: number;
    organizers: number;
    admins: number;
  };
  activity30d: {
    bookings: number;
    eventOrders: number;
    marketplaceOrders: number;
  };
  revenue: {
    guideRevenue: number;
    eventRevenue: number;
    marketplaceRevenue: number;
    total: number;
  };
  topRegions: {
    tourismSites: Array<{ region: string; count: number }>;
    events: Array<{ region: string; count: number }>;
  };
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export default function AdminNationalAnalyticsClient() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/admin/national-analytics', { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as
          | AnalyticsPayload
          | { error?: string };

        if (!response.ok) {
          setError(
            (payload as { error?: string }).error ??
              'Erreur chargement analytics',
          );
          return;
        }

        setData(payload as AnalyticsPayload);
      })
      .catch((reason: unknown) => {
        if (
          reason &&
          typeof reason === 'object' &&
          'name' in reason &&
          (reason as { name: string }).name === 'AbortError'
        ) {
          return;
        }

        setError('Erreur réseau analytics');
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  const overviewCards = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      { label: 'Utilisateurs', value: data.overview.totalUsers },
      { label: 'Sites touristiques', value: data.overview.totalSites },
      { label: 'Événements', value: data.overview.totalEvents },
      { label: 'Réservations', value: data.overview.totalBookings },
      { label: 'Produits artisans', value: data.overview.totalProducts },
      { label: 'Acteurs non vérifiés', value: data.overview.unverifiedActors },
    ];
  }, [data]);

  if (isLoading) {
    return (
      <p className="text-sm text-zinc-500">
        Chargement des analytics nationaux...
      </p>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!data) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-2xl border border-black/10 p-5 dark:border-white/15">
      <h2 className="text-xl font-semibold">Analytics nationaux</h2>

      <div className="grid gap-3 md:grid-cols-3">
        {overviewCards.map((card) => (
          <article
            key={card.label}
            className="rounded-xl border border-black/10 p-4 dark:border-white/15"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatNumber(card.value)}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="text-sm font-semibold">Répartition des acteurs</p>
          <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
            <li>Touristes: {formatNumber(data.actorsByRole.tourists)}</li>
            <li>Guides: {formatNumber(data.actorsByRole.guides)}</li>
            <li>Artisans: {formatNumber(data.actorsByRole.artisans)}</li>
            <li>Organisateurs: {formatNumber(data.actorsByRole.organizers)}</li>
            <li>Admins: {formatNumber(data.actorsByRole.admins)}</li>
          </ul>
        </article>

        <article className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="text-sm font-semibold">Activité (30 derniers jours)</p>
          <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
            <li>Réservations: {formatNumber(data.activity30d.bookings)}</li>
            <li>
              Commandes billets: {formatNumber(data.activity30d.eventOrders)}
            </li>
            <li>
              Commandes marketplace:{' '}
              {formatNumber(data.activity30d.marketplaceOrders)}
            </li>
          </ul>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="text-sm font-semibold">Revenus nationaux (FCFA)</p>
          <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
            <li>Guides: {formatNumber(data.revenue.guideRevenue)}</li>
            <li>Événements: {formatNumber(data.revenue.eventRevenue)}</li>
            <li>
              Marketplace: {formatNumber(data.revenue.marketplaceRevenue)}
            </li>
            <li className="font-semibold text-foreground">
              Total: {formatNumber(data.revenue.total)}
            </li>
          </ul>
        </article>

        <article className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="text-sm font-semibold">Top régions (offre)</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-medium">Sites touristiques</p>
              <ul className="mt-1 space-y-1 text-zinc-600 dark:text-zinc-300">
                {data.topRegions.tourismSites.map((entry) => (
                  <li key={`site-${entry.region}`}>
                    {entry.region}: {formatNumber(entry.count)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Événements</p>
              <ul className="mt-1 space-y-1 text-zinc-600 dark:text-zinc-300">
                {data.topRegions.events.map((entry) => (
                  <li key={`evt-${entry.region}`}>
                    {entry.region}: {formatNumber(entry.count)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
