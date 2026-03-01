'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type GeoState = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
};

type AdviceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const ISSUE_OPTIONS = [
  { value: 'ACCIDENT', label: 'Accident' },
  { value: 'MALAISE', label: 'Malaise / Santé' },
  { value: 'AGRESSION', label: 'Agression / Menace' },
  { value: 'PERTE', label: 'Perte / Personne disparue' },
  { value: 'INCENDIE', label: 'Incendie / Danger immédiat' },
  { value: 'AUTRE', label: 'Autre urgence' },
] as const;

function adviceFor(issueType: string, severity: AdviceLevel) {
  const generic = [
    'Restez dans un endroit visible et sécurisé.',
    'Gardez votre téléphone chargé et le son activé.',
    'Partagez votre position avec un proche de confiance.',
  ];

  const critical =
    severity === 'CRITICAL' || severity === 'HIGH'
      ? [
          'Appelez immédiatement les secours nationaux (112).',
          'Ne vous déplacez pas seul si vous êtes en danger.',
        ]
      : [];

  if (issueType === 'MALAISE') {
    return [
      ...critical,
      'Asseyez-vous ou allongez-vous dans une zone ventilée.',
      'Hydratez-vous et évitez tout effort physique.',
      ...generic,
    ];
  }

  if (issueType === 'AGRESSION') {
    return [
      ...critical,
      'Dirigez-vous vers un lieu public fréquenté (hôtel, commerce, poste).',
      'Évitez toute confrontation directe avec l’agresseur.',
      ...generic,
    ];
  }

  if (issueType === 'INCENDIE') {
    return [
      ...critical,
      'Évacuez immédiatement la zone à risque.',
      'Évitez les ascenseurs et les zones enfumées.',
      ...generic,
    ];
  }

  return [...critical, ...generic];
}

export default function UrgencePage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [geo, setGeo] = useState<GeoState | null>(null);
  const [geoError, setGeoError] = useState('');
  const [watchId, setWatchId] = useState<number | null>(null);

  const [issueType, setIssueType] =
    useState<(typeof ISSUE_OPTIONS)[number]['value']>('ACCIDENT');
  const [severity, setSeverity] = useState<AdviceLevel>('HIGH');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch('/api/auth/me');

        if (!response.ok) {
          router.replace('/login?returnTo=%2Furgence');
          return;
        }

        const data = (await response.json()) as {
          user?: { email?: string };
        };

        if (!active) {
          return;
        }

        setUserEmail(data.user?.email ?? '');
      } catch {
        router.replace('/login?returnTo=%2Furgence');
      } finally {
        if (active) {
          setIsCheckingAuth(false);
        }
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (isCheckingAuth) {
      return;
    }

    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n’est pas supportée sur cet appareil.');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setGeoError('');
        setGeo({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Number.isFinite(position.coords.accuracy)
            ? position.coords.accuracy
            : null,
          timestamp: position.timestamp,
        });
      },
      () => {
        setGeoError(
          'Impossible de récupérer votre position. Autorisez la localisation dans le navigateur.',
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      },
    );

    setWatchId(id);

    return () => {
      navigator.geolocation.clearWatch(id);
    };
  }, [isCheckingAuth]);

  useEffect(() => {
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const mapSrc = useMemo(() => {
    if (!geo) {
      return null;
    }

    return `https://www.google.com/maps?q=${geo.latitude},${geo.longitude}&z=16&output=embed`;
  }, [geo]);

  const advices = useMemo(
    () => adviceFor(issueType, severity),
    [issueType, severity],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!description.trim()) {
      setSubmitError('Veuillez décrire le problème.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const response = await fetch('/api/emergency-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueType,
          severity,
          description,
          contactPhone,
          latitude: geo?.latitude,
          longitude: geo?.longitude,
          locationAccuracyM: geo?.accuracy,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        alert?: { id: string; createdAt: string };
      };

      if (!response.ok) {
        setSubmitError(
          data.error ?? 'Impossible d’enregistrer votre signalement.',
        );
        return;
      }

      setSubmitSuccess(
        `Signalement enregistré (#${data.alert?.id ?? 'N/A'}). Un administrateur est notifié avec votre position.`,
      );
    } catch {
      setSubmitError('Erreur réseau, veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  if (isCheckingAuth) {
    return (
      <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
        <p className="text-sm text-zinc-500">Vérification de la session...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8 lg:px-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Alerte urgence
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Localisation en temps réel et signalement immédiat pour intervention.
        </p>
        <p className="text-xs text-zinc-500">Compte connecté: {userEmail}</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <article className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/15 dark:bg-zinc-950">
          <div className="border-b border-black/10 px-4 py-3 dark:border-white/15">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Votre position actuelle
            </p>
            {geo ? (
              <p className="text-xs text-zinc-500">
                Lat {geo.latitude.toFixed(6)} • Lng {geo.longitude.toFixed(6)}
                {geo.accuracy !== null
                  ? ` • précision ±${Math.round(geo.accuracy)} m`
                  : ''}
              </p>
            ) : (
              <p className="text-xs text-zinc-500">
                En attente de la géolocalisation...
              </p>
            )}
            {geoError ? (
              <p className="mt-1 text-xs text-red-600">{geoError}</p>
            ) : null}
          </div>

          <div className="h-[420px] w-full bg-zinc-100 dark:bg-zinc-900">
            {mapSrc ? (
              <iframe
                title="Carte de localisation urgence"
                src={mapSrc}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500">
                Activez la géolocalisation pour afficher la carte en direct.
              </div>
            )}
          </div>
        </article>

        <div className="space-y-4">
          <form
            onSubmit={handleSubmit}
            className="space-y-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950"
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Déclarer le problème
            </h2>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Type de problème</label>
              <select
                value={issueType}
                onChange={(event) =>
                  setIssueType(
                    event.target
                      .value as (typeof ISSUE_OPTIONS)[number]['value'],
                  )
                }
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
              >
                {ISSUE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Niveau d’urgence</label>
              <select
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value as AdviceLevel)
                }
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
              >
                <option value="LOW">Faible</option>
                <option value="MEDIUM">Moyen</option>
                <option value="HIGH">Élevé</option>
                <option value="CRITICAL">Critique</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Décrivez clairement la situation et les risques immédiats..."
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">
                Téléphone de contact
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                placeholder="+225 ..."
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
              />
            </div>

            {submitError ? (
              <p className="text-sm text-red-600">{submitError}</p>
            ) : null}
            {submitSuccess ? (
              <p className="text-sm text-emerald-600">{submitSuccess}</p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {submitting
                ? 'Envoi du signalement...'
                : 'Envoyer le signalement'}
            </button>
          </form>

          <article className="space-y-2 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              Conseils immédiats
            </h3>
            <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-200">
              {advices.map((advice) => (
                <li key={advice}>• {advice}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
