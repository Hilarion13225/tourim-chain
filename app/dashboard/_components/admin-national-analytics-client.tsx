'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

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
    restaurantOrders: number;
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
  dataDriven: {
    windowDays: number;
    conversion30d: {
      createdOrders: number;
      confirmedPayments: number;
      receiptViews: number;
      paymentConversionRate: number;
      receiptViewRate: number;
    };
    emergency30d: {
      created: number;
      resolved: number;
      resolutionRate: number;
      averageResolutionMinutes: number;
    };
    topModules: Array<{ module: string; count: number }>;
    recommendedActions: Array<{
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      title: string;
      reason: string;
    }>;
  };
};

type BackfillStatsPayload = {
  analyticsTableExists: boolean;
  summary: {
    totalEvents: number;
    backfillEvents: number;
    runtimeEvents: number;
    latestEventAt: string | null;
  };
  byEventType: Array<{
    eventType: string;
    total: number;
    backfill: number;
    runtime: number;
  }>;
};

type BlockchainAssetsPayload = {
  summary: {
    totalAssets: number;
    byEntityType: Array<{ entityType: string; count: number }>;
  };
  assets: Array<{
    id: string;
    ownerId: string;
    entityType: string;
    wallet: string;
    hashTransaction: string;
    mintedAt: string;
    sourceType: string;
    sourceId: string;
    network: string;
    explorerUrl?: string | null;
  }>;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDate(value: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export default function AdminNationalAnalyticsClient() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDays, setSelectedDays] = useState<7 | 30 | 90>(30);
  const [backfillStats, setBackfillStats] =
    useState<BackfillStatsPayload | null>(null);
  const [backfillError, setBackfillError] = useState('');
  const [blockchainAssets, setBlockchainAssets] =
    useState<BlockchainAssetsPayload | null>(null);
  const [blockchainError, setBlockchainError] = useState('');
  const [reanchorLoadingId, setReanchorLoadingId] = useState<string | null>(
    null,
  );
  const [isReanchorBatchLoading, setIsReanchorBatchLoading] = useState(false);
  const [reanchorMessage, setReanchorMessage] = useState('');

  const certificationAssets = useMemo(() => {
    if (!blockchainAssets) {
      return [];
    }

    return blockchainAssets.assets.filter(
      (asset) => asset.sourceType === 'CERTIFICATION',
    );
  }, [blockchainAssets]);

  const offchainCertificationAssets = useMemo(
    () => certificationAssets.filter((asset) => asset.network === 'OFFCHAIN'),
    [certificationAssets],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/admin/national-analytics?days=${selectedDays}`, {
      signal: controller.signal,
    })
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
  }, [selectedDays]);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/admin/analytics-backfill-stats', {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as
          | BackfillStatsPayload
          | { error?: string };

        if (!response.ok) {
          setBackfillError(
            (payload as { error?: string }).error ??
              'Erreur chargement diagnostic backfill',
          );
          return;
        }

        setBackfillStats(payload as BackfillStatsPayload);
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

        setBackfillError('Erreur réseau diagnostic backfill');
      });

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/admin/blockchain-assets?limit=10', {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as
          | BlockchainAssetsPayload
          | { error?: string };

        if (!response.ok) {
          setBlockchainError(
            (payload as { error?: string }).error ??
              'Erreur chargement traçabilité blockchain',
          );
          return;
        }

        setBlockchainAssets(payload as BlockchainAssetsPayload);
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

        setBlockchainError('Erreur réseau traçabilité blockchain');
      });

    return () => {
      controller.abort();
    };
  }, []);

  async function loadBlockchainAssets() {
    setBlockchainError('');

    const response = await fetch('/api/admin/blockchain-assets?limit=10');
    const payload = (await response.json()) as
      | BlockchainAssetsPayload
      | { error?: string };

    if (!response.ok) {
      setBlockchainError(
        (payload as { error?: string }).error ??
          'Erreur chargement traçabilité blockchain',
      );
      return;
    }

    setBlockchainAssets(payload as BlockchainAssetsPayload);
  }

  async function handleReanchorCertification(certificationId: string) {
    setReanchorMessage('');
    setBlockchainError('');
    setReanchorLoadingId(certificationId);

    try {
      const response = await fetch(
        '/api/admin/blockchain-reanchor-certification',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ certificationId }),
        },
      );

      const payload = (await response.json()) as {
        error?: string;
        txHash?: string;
      };

      if (!response.ok) {
        setBlockchainError(
          payload.error ?? 'Échec du re-ancrage de la certification',
        );
        return;
      }

      setReanchorMessage(
        `Certification ${certificationId} re-ancrée (${payload.txHash?.slice(0, 10) ?? 'tx'}…).`,
      );
      await loadBlockchainAssets();
    } catch {
      setBlockchainError('Erreur réseau pendant le re-ancrage');
    } finally {
      setReanchorLoadingId(null);
    }
  }

  async function handleReanchorAllOffchainCertifications() {
    setReanchorMessage('');
    setBlockchainError('');
    setIsReanchorBatchLoading(true);

    try {
      const response = await fetch(
        '/api/admin/blockchain-reanchor-certification',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ allOffchain: true }),
        },
      );

      const payload = (await response.json()) as {
        error?: string;
        processed?: number;
        succeeded?: number;
        failed?: number;
      };

      if (!response.ok) {
        setBlockchainError(payload.error ?? 'Échec du re-ancrage batch');
        return;
      }

      setReanchorMessage(
        `Batch terminé: ${payload.succeeded ?? 0}/${payload.processed ?? 0} certifications re-ancrées (${payload.failed ?? 0} échec(s)).`,
      );
      await loadBlockchainAssets();
    } catch {
      setBlockchainError('Erreur réseau pendant le re-ancrage batch');
    } finally {
      setIsReanchorBatchLoading(false);
    }
  }

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

  const actorsChartData = {
    labels: ['Touristes', 'Guides', 'Artisans', 'Organisateurs', 'Admins'],
    datasets: [
      {
        data: [
          data.actorsByRole.tourists,
          data.actorsByRole.guides,
          data.actorsByRole.artisans,
          data.actorsByRole.organizers,
          data.actorsByRole.admins,
        ],
        backgroundColor: [
          'rgba(249, 115, 22, 0.75)',
          'rgba(59, 130, 246, 0.75)',
          'rgba(16, 185, 129, 0.75)',
          'rgba(168, 85, 247, 0.75)',
          'rgba(113, 113, 122, 0.75)',
        ],
      },
    ],
  };

  const activityChartData = {
    labels: ['Réservations', 'Billets', 'Marketplace', 'Restauration'],
    datasets: [
      {
        label: `Volume ${data.dataDriven.windowDays} jours`,
        data: [
          data.activity30d.bookings,
          data.activity30d.eventOrders,
          data.activity30d.marketplaceOrders,
          data.activity30d.restaurantOrders,
        ],
        backgroundColor: 'rgba(249, 115, 22, 0.75)',
      },
    ],
  };

  const revenueChartData = {
    labels: ['Guides', 'Événements', 'Marketplace'],
    datasets: [
      {
        label: 'Revenus FCFA',
        data: [
          data.revenue.guideRevenue,
          data.revenue.eventRevenue,
          data.revenue.marketplaceRevenue,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.75)',
          'rgba(16, 185, 129, 0.75)',
          'rgba(249, 115, 22, 0.75)',
        ],
      },
    ],
  };

  const conversionChartData = {
    labels: ['Créées', 'Payées', 'Reçu consulté'],
    datasets: [
      {
        label: `Pipeline ${data.dataDriven.windowDays} jours`,
        data: [
          data.dataDriven.conversion30d.createdOrders,
          data.dataDriven.conversion30d.confirmedPayments,
          data.dataDriven.conversion30d.receiptViews,
        ],
        borderColor: 'rgba(249, 115, 22, 0.9)',
        backgroundColor: 'rgba(249, 115, 22, 0.3)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const emergencyChartData = {
    labels: ['Urgences créées', 'Urgences résolues'],
    datasets: [
      {
        label: `Urgence ${data.dataDriven.windowDays} jours`,
        data: [
          data.dataDriven.emergency30d.created,
          data.dataDriven.emergency30d.resolved,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.75)',
          'rgba(16, 185, 129, 0.75)',
        ],
      },
    ],
  };

  const topModulesChartData = {
    labels: data.dataDriven.topModules.map((entry) => entry.module),
    datasets: [
      {
        label: 'Activité',
        data: data.dataDriven.topModules.map((entry) => entry.count),
        backgroundColor: 'rgba(113, 113, 122, 0.75)',
      },
    ],
  };

  const topRegionsLabels = Array.from(
    new Set([
      ...data.topRegions.tourismSites.map((entry) => entry.region),
      ...data.topRegions.events.map((entry) => entry.region),
    ]),
  );

  const topRegionsChartData = {
    labels: topRegionsLabels,
    datasets: [
      {
        label: 'Sites touristiques',
        data: topRegionsLabels.map(
          (region) =>
            data.topRegions.tourismSites.find(
              (entry) => entry.region === region,
            )?.count ?? 0,
        ),
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
      },
      {
        label: 'Événements',
        data: topRegionsLabels.map(
          (region) =>
            data.topRegions.events.find((entry) => entry.region === region)
              ?.count ?? 0,
        ),
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#71717a',
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#71717a' },
        grid: { color: 'rgba(113, 113, 122, 0.15)' },
      },
      y: {
        ticks: { color: '#71717a' },
        grid: { color: 'rgba(113, 113, 122, 0.15)' },
      },
    },
  };

  return (
    <section className="space-y-6 rounded-2xl border border-black/10 p-5 dark:border-white/15">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Analytics nationaux</h2>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((days) => {
            const typedDays = days as 7 | 30 | 90;
            const isActive = selectedDays === typedDays;

            return (
              <button
                key={days}
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setError('');
                  setSelectedDays(typedDays);
                }}
                className={`rounded-lg border px-3 py-1 text-sm transition ${
                  isActive
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-black/10 text-zinc-700 hover:border-orange-300 dark:border-white/15 dark:text-zinc-300 dark:hover:border-orange-400'
                }`}
              >
                {days}j
              </button>
            );
          })}
        </div>
      </div>

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
          <div className="mt-3 h-64">
            <Doughnut data={actorsChartData} />
          </div>
        </article>

        <article className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="text-sm font-semibold">
            Activité ({data.dataDriven.windowDays} derniers jours)
          </p>
          <div className="mt-3 h-64">
            <Bar data={activityChartData} options={chartOptions} />
          </div>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="text-sm font-semibold">Revenus nationaux (FCFA)</p>
          <div className="mt-3 h-64">
            <Bar data={revenueChartData} options={chartOptions} />
          </div>
          <p className="mt-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Total: {formatNumber(data.revenue.total)} FCFA
          </p>
        </article>

        <article className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="text-sm font-semibold">Top régions (offre)</p>
          <div className="mt-3 h-64">
            <Bar data={topRegionsChartData} options={chartOptions} />
          </div>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="text-sm font-semibold">
            Pilotage data-driven ({data.dataDriven.windowDays} jours)
          </p>
          <div className="mt-3 h-64">
            <Line data={conversionChartData} options={chartOptions} />
          </div>
          <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
            <li>
              Conversion paiement:{' '}
              {formatPercent(
                data.dataDriven.conversion30d.paymentConversionRate,
              )}
            </li>
            <li>
              Taux consultation reçu:{' '}
              {formatPercent(data.dataDriven.conversion30d.receiptViewRate)}
            </li>
          </ul>
        </article>

        <article className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="text-sm font-semibold">Urgences et modules actifs</p>
          <div className="mt-3 h-40">
            <Bar data={emergencyChartData} options={chartOptions} />
          </div>
          <div className="mt-3 h-40">
            {data.dataDriven.topModules.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Aucune donnée collectée pour le moment.
              </p>
            ) : (
              <Bar
                data={topModulesChartData}
                options={{
                  ...chartOptions,
                  indexAxis: 'y' as const,
                }}
              />
            )}
          </div>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
            Résolution urgence:{' '}
            {formatPercent(data.dataDriven.emergency30d.resolutionRate)} • Délai
            moyen:{' '}
            {formatNumber(
              Math.round(data.dataDriven.emergency30d.averageResolutionMinutes),
            )}{' '}
            min
          </p>
        </article>
      </div>

      <article className="rounded-xl border border-black/10 p-4 dark:border-white/15">
        <p className="text-sm font-semibold">Actions recommandées (niveau 3)</p>
        <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          {data.dataDriven.recommendedActions.length === 0 ? (
            <li>Aucune action prioritaire détectée.</li>
          ) : (
            data.dataDriven.recommendedActions.map((action) => (
              <li key={`${action.priority}-${action.title}`}>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  [{action.priority}] {action.title}
                </span>{' '}
                — {action.reason}
              </li>
            ))
          )}
        </ul>
      </article>

      <article className="rounded-xl border border-black/10 p-4 dark:border-white/15">
        <p className="text-sm font-semibold">Diagnostic backfill analytics</p>

        {backfillError ? (
          <p className="mt-2 text-sm text-red-600">{backfillError}</p>
        ) : !backfillStats ? (
          <p className="mt-2 text-sm text-zinc-500">
            Chargement du diagnostic...
          </p>
        ) : !backfillStats.analyticsTableExists ? (
          <p className="mt-2 text-sm text-zinc-500">
            Table AnalyticsEvent absente.
          </p>
        ) : (
          <>
            <div className="mt-3 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300 md:grid-cols-2">
              <p>
                Total événements:{' '}
                {formatNumber(backfillStats.summary.totalEvents)}
              </p>
              <p>
                Backfill: {formatNumber(backfillStats.summary.backfillEvents)}
              </p>
              <p>
                Runtime: {formatNumber(backfillStats.summary.runtimeEvents)}
              </p>
              <p>
                Dernier event: {formatDate(backfillStats.summary.latestEventAt)}
              </p>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="pb-2 pr-4 font-medium">Event type</th>
                    <th className="pb-2 pr-4 font-medium">Total</th>
                    <th className="pb-2 pr-4 font-medium">Backfill</th>
                    <th className="pb-2 font-medium">Runtime</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-700 dark:text-zinc-200">
                  {backfillStats.byEventType.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-2 text-zinc-500">
                        Aucun événement trouvé.
                      </td>
                    </tr>
                  ) : (
                    backfillStats.byEventType.map((row) => (
                      <tr
                        key={row.eventType}
                        className="border-t border-black/10 dark:border-white/10"
                      >
                        <td className="py-2 pr-4">{row.eventType}</td>
                        <td className="py-2 pr-4">{formatNumber(row.total)}</td>
                        <td className="py-2 pr-4">
                          {formatNumber(row.backfill)}
                        </td>
                        <td className="py-2">{formatNumber(row.runtime)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </article>

      <article className="rounded-xl border border-black/10 p-4 dark:border-white/15">
        <p className="text-sm font-semibold">Traçabilité blockchain (admin)</p>

        {blockchainError ? (
          <p className="mt-2 text-sm text-red-600">{blockchainError}</p>
        ) : !blockchainAssets ? (
          <p className="mt-2 text-sm text-zinc-500">
            Chargement des actifs blockchain...
          </p>
        ) : (
          <>
            <div className="mt-3 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300 md:grid-cols-2">
              <p>
                Total actifs: {formatNumber(blockchainAssets.summary.totalAssets)}
              </p>
              <p>
                Types: {blockchainAssets.summary.byEntityType.length}
              </p>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">Source</th>
                    <th className="pb-2 pr-4 font-medium">Tx</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-700 dark:text-zinc-200">
                  {blockchainAssets.assets.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-2 text-zinc-500">
                        Aucun actif blockchain enregistré.
                      </td>
                    </tr>
                  ) : (
                    blockchainAssets.assets.map((asset) => (
                      <tr
                        key={asset.id}
                        className="border-t border-black/10 dark:border-white/10"
                      >
                        <td className="py-2 pr-4">{asset.entityType}</td>
                        <td className="py-2 pr-4">{asset.sourceType}:{asset.sourceId}</td>
                        <td className="py-2 pr-4" title={asset.hashTransaction}>
                          {asset.hashTransaction.slice(0, 10)}…{asset.hashTransaction.slice(-8)}
                        </td>
                        <td className="py-2">{formatDate(asset.mintedAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </article>

      <article className="rounded-xl border border-black/10 p-4 dark:border-white/15">
        <p className="text-sm font-semibold">Certifications blockchain (admin)</p>

        {blockchainError ? (
          <p className="mt-2 text-sm text-red-600">{blockchainError}</p>
        ) : !blockchainAssets ? (
          <p className="mt-2 text-sm text-zinc-500">
            Chargement des certifications blockchain...
          </p>
        ) : (
          <>
            {reanchorMessage ? (
              <p className="mt-2 text-sm text-emerald-600">{reanchorMessage}</p>
            ) : null}
            <div className="mt-3 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300 md:grid-cols-2">
              <p>
                Certifications ancrées: {formatNumber(certificationAssets.length)}
              </p>
              <p>
                Type CERTIFICATION:{' '}
                {formatNumber(
                  blockchainAssets.summary.byEntityType.find(
                    (entry) => entry.entityType === 'CERTIFICATION',
                  )?.count ?? 0,
                )}
              </p>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  void handleReanchorAllOffchainCertifications();
                }}
                disabled={
                  isReanchorBatchLoading || offchainCertificationAssets.length === 0
                }
                className="inline-flex rounded-md border border-orange-300 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-60 dark:border-orange-400/40 dark:text-orange-300 dark:hover:bg-orange-900/20"
              >
                {isReanchorBatchLoading
                  ? 'Re-ancrage batch...'
                  : `Re-ancrer toutes les certifications OFFCHAIN (${offchainCertificationAssets.length})`}
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="pb-2 pr-4 font-medium">Certification</th>
                    <th className="pb-2 pr-4 font-medium">Tx</th>
                    <th className="pb-2 pr-4 font-medium">Réseau</th>
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 font-medium">Vérification</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-700 dark:text-zinc-200">
                  {certificationAssets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-2 text-zinc-500">
                        Aucune certification blockchain trouvée.
                      </td>
                    </tr>
                  ) : (
                    certificationAssets.map((asset) => (
                      <tr
                        key={asset.id}
                        className="border-t border-black/10 dark:border-white/10"
                      >
                        <td className="py-2 pr-4">{asset.sourceType}:{asset.sourceId}</td>
                        <td className="py-2 pr-4" title={asset.hashTransaction}>
                          {asset.hashTransaction.slice(0, 10)}…{asset.hashTransaction.slice(-8)}
                        </td>
                        <td className="py-2 pr-4">{asset.network}</td>
                        <td className="py-2 pr-4">{formatDate(asset.mintedAt)}</td>
                        <td className="py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {asset.explorerUrl ? (
                              <a
                                href={asset.explorerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-white/20 dark:text-zinc-200 dark:hover:bg-zinc-800"
                              >
                                Explorer
                              </a>
                            ) : (
                              <span className="text-zinc-500">OFFCHAIN</span>
                            )}

                            {asset.network === 'OFFCHAIN' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  void handleReanchorCertification(asset.sourceId);
                                }}
                                disabled={
                                  reanchorLoadingId === asset.sourceId ||
                                  isReanchorBatchLoading
                                }
                                className="inline-flex rounded-md border border-orange-300 px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-60 dark:border-orange-400/40 dark:text-orange-300 dark:hover:bg-orange-900/20"
                              >
                                {reanchorLoadingId === asset.sourceId
                                  ? 'Re-ancrage...'
                                  : 'Re-ancrer on-chain'}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </article>
    </section>
  );
}
