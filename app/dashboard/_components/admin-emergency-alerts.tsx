'use client';

import { useEffect, useMemo, useState } from 'react';

type EmergencyAlertItem = {
  id: string;
  issueType: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  latitude: number | string | null;
  longitude: number | string | null;
  locationAccuracyM: number | string | null;
  contactPhone: string | null;
  status: string;
  createdAt: string;
  tourist: {
    id: string;
    nom: string;
    email: string;
    phone: string | null;
  };
};

function toFiniteNumberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function severityBadgeClass(severity: string) {
  if (severity === 'CRITICAL')
    return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300';
  if (severity === 'HIGH')
    return 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300';
  if (severity === 'MEDIUM')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
  return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
}

function issueTypeLabel(issueType: string) {
  switch (issueType) {
    case 'ACCIDENT':
      return 'Accident';
    case 'MALAISE':
      return 'Malaise / Santé';
    case 'AGRESSION':
      return 'Agression / Menace';
    case 'PERTE':
      return 'Perte / Personne disparue';
    case 'INCENDIE':
      return 'Incendie / Danger immédiat';
    default:
      return 'Autre urgence';
  }
}

export default function AdminEmergencyAlerts() {
  const [alerts, setAlerts] = useState<EmergencyAlertItem[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAlerts() {
      try {
        const response = await fetch('/api/emergency-alerts');
        const data = (await response.json()) as
          | EmergencyAlertItem[]
          | { error?: string };

        if (!active) {
          return;
        }

        if (!response.ok) {
          setError(
            (data as { error?: string }).error ??
              'Erreur de chargement des alertes',
          );
          setAlerts([]);
          setSelectedAlertId('');
          return;
        }

        const list = (data as EmergencyAlertItem[]).map((item) => ({
          ...item,
          latitude: toFiniteNumberOrNull(item.latitude),
          longitude: toFiniteNumberOrNull(item.longitude),
          locationAccuracyM: toFiniteNumberOrNull(item.locationAccuracyM),
        }));
        setAlerts(list);
        setSelectedAlertId((prev) => {
          if (prev && list.some((item) => item.id === prev)) {
            return prev;
          }

          return list[0]?.id ?? '';
        });
      } catch {
        if (!active) {
          return;
        }
        setError('Erreur réseau pendant le chargement des alertes.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadAlerts();
    const intervalId = window.setInterval(() => {
      void loadAlerts();
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const selectedAlert = useMemo(
    () => alerts.find((alert) => alert.id === selectedAlertId) ?? null,
    [alerts, selectedAlertId],
  );

  async function updateAlertStatus(status: 'IN_PROGRESS' | 'RESOLVED') {
    if (!selectedAlert) {
      return;
    }

    setUpdatingStatus(true);
    setError('');

    try {
      const response = await fetch('/api/emergency-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: selectedAlert.id,
          status,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? 'Impossible de mettre à jour le statut.');
        return;
      }

      setAlerts((prev) =>
        prev.map((item) =>
          item.id === selectedAlert.id
            ? {
                ...item,
                status,
              }
            : item,
        ),
      );
    } catch {
      setError('Erreur réseau pendant la mise à jour du statut.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  const mapSrc = useMemo(() => {
    if (!selectedAlert) {
      return null;
    }

    const latitude = toFiniteNumberOrNull(selectedAlert.latitude);
    const longitude = toFiniteNumberOrNull(selectedAlert.longitude);

    if (latitude === null || longitude === null) {
      return null;
    }

    return `https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;
  }, [selectedAlert]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Alertes urgence
          </h2>
          <p className="text-sm text-zinc-500">
            Signalements en temps quasi réel (rafraîchissement automatique
            toutes les 10s).
          </p>
        </div>
        <p className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {alerts.length} alerte(s)
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Chargement des alertes...</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-600 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-300">
                Aucune alerte urgence pour le moment.
              </p>
            ) : (
              alerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={`w-full space-y-2 rounded-2xl border p-4 text-left transition ${
                    selectedAlertId === alert.id
                      ? 'border-red-500 bg-red-50/50 dark:border-red-400 dark:bg-red-500/10'
                      : 'border-black/10 bg-white hover:border-black/20 dark:border-white/15 dark:bg-zinc-950 dark:hover:border-white/25'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {issueTypeLabel(alert.issueType)} • {alert.tourist.nom}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${severityBadgeClass(alert.severity)}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {alert.status}
                      </span>
                    </div>
                  </div>

                  <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {alert.description}
                  </p>

                  <div className="grid gap-1 text-xs text-zinc-500 md:grid-cols-2">
                    <p>Référence: #{alert.id}</p>
                    <p>
                      Date: {new Date(alert.createdAt).toLocaleString('fr-FR')}
                    </p>
                    <p>Email: {alert.tourist.email}</p>
                    <p>
                      Tél:{' '}
                      {alert.contactPhone ||
                        alert.tourist.phone ||
                        'Non renseigné'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          <article className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/15 dark:bg-zinc-950">
            <div className="border-b border-black/10 px-4 py-3 dark:border-white/15">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Localisation du touriste
              </p>
              {selectedAlert ? (
                <p className="text-xs text-zinc-500">
                  {selectedAlert.tourist.nom}
                  {toFiniteNumberOrNull(selectedAlert.latitude) !== null &&
                  toFiniteNumberOrNull(selectedAlert.longitude) !== null
                    ? ` • ${toFiniteNumberOrNull(selectedAlert.latitude)?.toFixed(6)}, ${toFiniteNumberOrNull(selectedAlert.longitude)?.toFixed(6)}`
                    : ' • position indisponible'}
                </p>
              ) : (
                <p className="text-xs text-zinc-500">
                  Sélectionnez une alerte pour voir la position.
                </p>
              )}

              {selectedAlert ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      updatingStatus || selectedAlert.status === 'IN_PROGRESS'
                    }
                    onClick={() => {
                      void updateAlertStatus('IN_PROGRESS');
                    }}
                    className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 disabled:opacity-50"
                  >
                    {updatingStatus ? 'Mise à jour...' : 'Marquer en cours'}
                  </button>
                  <button
                    type="button"
                    disabled={
                      updatingStatus || selectedAlert.status === 'RESOLVED'
                    }
                    onClick={() => {
                      void updateAlertStatus('RESOLVED');
                    }}
                    className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                  >
                    {updatingStatus ? 'Mise à jour...' : 'Marquer comme traité'}
                  </button>
                </div>
              ) : null}
            </div>

            <div className="h-[420px] w-full bg-zinc-100 dark:bg-zinc-900">
              {mapSrc ? (
                <iframe
                  title="Carte localisation alerte"
                  src={mapSrc}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500">
                  Aucune coordonnée GPS disponible pour cette alerte.
                </div>
              )}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
