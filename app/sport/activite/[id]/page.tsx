'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type PaymentMethod =
  | 'MOBILE_MONEY'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'CASH_ON_SERVICE';

type PaymentOption = {
  method: PaymentMethod;
  title: string;
  account: string;
  minLabel: string;
  maxLabel: string;
};

type EventDetail = {
  id: string;
  nom: string;
  photoUrl?: string | null;
  description: string;
  lieu: string;
  ticketTypes?: Array<{ id: string; prix: string }>;
};

type OrganizerMeta = {
  itemType?: 'ACTIVITY' | 'EVENT';
  category?: string;
  intensity?: number;
  durationHours?: number;
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

function visibleDescription(description: string) {
  if (!description.startsWith('__ORG_META__')) {
    return description;
  }

  const firstLineBreak = description.indexOf('\n');
  return firstLineBreak >= 0 ? description.slice(firstLineBreak + 1) : '';
}

function formatXof(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} XOF`;
}

const paymentOptions: PaymentOption[] = [
  {
    method: 'MOBILE_MONEY',
    title: 'Wave',
    account: '+225 5 94 26 24 22',
    minLabel: 'Min 300 F',
    maxLabel: 'Max 2 000 000 F',
  },
  {
    method: 'CARD',
    title: 'Orange Money',
    account: '+225 7 67 55 76 71',
    minLabel: 'Min 300 F',
    maxLabel: 'Max 2 000 000 F',
  },
  {
    method: 'BANK_TRANSFER',
    title: 'MTN Money',
    account: '+225 7 06 12 45 94',
    minLabel: 'Min 300 F',
    maxLabel: 'Max 2 000 000 F',
  },
  {
    method: 'CASH_ON_SERVICE',
    title: 'Paiement sur place',
    account: 'Règlement à l’accueil',
    minLabel: 'Min 300 F',
    maxLabel: 'Max 2 000 000 F',
  },
];

export default function SportActiviteReservationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const activityId = params?.id;

  const [item, setItem] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [participants, setParticipants] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!activityId) {
      return;
    }

    let active = true;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const authResponse = await fetch('/api/auth/me');

        if (!authResponse.ok) {
          if (!active) {
            return;
          }

          const returnTo = encodeURIComponent(`/sport/activite/${activityId}`);
          router.replace(`/login?returnTo=${returnTo}`);
          return;
        }

        const authData = (await authResponse.json()) as {
          user?: {
            nom?: string;
            email?: string;
            phone?: string | null;
          };
        };

        if (!active) {
          return;
        }

        setNom(authData.user?.nom ?? '');
        setEmail(authData.user?.email ?? '');
        setTelephone(authData.user?.phone ?? '');

        const response = await fetch(`/api/events/${activityId}`);
        const data = (await response.json()) as
          | EventDetail
          | { error?: string };

        if (!response.ok) {
          if (!active) {
            return;
          }

          setError(
            (data as { error?: string }).error ?? 'Activité introuvable',
          );
          setItem(null);
          return;
        }

        const meta = parseOrganizerMeta(
          (data as EventDetail).description ?? '',
        );

        if (meta.itemType && meta.itemType !== 'ACTIVITY') {
          setError('Cette ressource n’est pas une activité sportive.');
          setItem(null);
          return;
        }

        setItem(data as EventDetail);
      } catch {
        if (!active) {
          return;
        }

        setError('Erreur réseau pendant le chargement.');
        setItem(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [activityId, router]);

  const meta = useMemo(
    () => parseOrganizerMeta(item?.description ?? ''),
    [item?.description],
  );

  const unitAmount = useMemo(
    () => Number(item?.ticketTypes?.[0]?.prix ?? 0),
    [item?.ticketTypes],
  );

  const totalAmount = Math.max(1, participants) * unitAmount;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!item || !activityId) {
      return;
    }

    if (!paymentMethod) {
      setSubmitError('Veuillez choisir un moyen de paiement.');
      return;
    }

    setSubmitError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/events/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: activityId,
          quantity: Math.max(1, participants),
          autoPaid: false,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        orderId?: string;
        totalAmount?: number;
      };

      if (!response.ok) {
        if (response.status === 401) {
          const returnTo = encodeURIComponent(`/sport/activite/${activityId}`);
          router.push(`/login?returnTo=${returnTo}`);
          return;
        }

        setSubmitError(data.error ?? 'Réservation impossible.');
        return;
      }

      const paymentParams = new URLSearchParams({
        orderId: data.orderId ?? 'N/A',
        activityId,
        activityName: item.nom,
        fullName: nom,
        phone: telephone,
        email,
        address,
        serviceDate,
        paymentMethod,
        paymentMethodLabel:
          paymentOptions.find((option) => option.method === paymentMethod)
            ?.title ?? paymentMethod,
        participants: String(Math.max(1, participants)),
        unitAmount: String(unitAmount),
        totalAmount: String(Number(data.totalAmount ?? totalAmount)),
        notes,
      });

      router.push(
        `/sport/activite/${activityId}/paiement?${paymentParams.toString()}`,
      );
    } catch {
      setSubmitError('Erreur réseau pendant la réservation.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
        <p className="text-sm text-zinc-500">Chargement de la réservation...</p>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="mx-auto w-full max-w-7xl space-y-4 px-6 py-10 lg:px-10">
        <p className="text-sm text-red-600">
          {error || 'Activité introuvable.'}
        </p>
        <Link
          href="/sport"
          className="inline-flex rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
        >
          Retour au sport
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8 lg:px-10">
      <p className="text-xs text-zinc-500">
        <Link href="/sport" className="hover:underline">
          Sport
        </Link>{' '}
        {'>'} Activité {'>'}{' '}
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
          {item.nom}
        </span>
      </p>

      <section className="grid gap-6 lg:grid-cols-[1fr_330px]">
        <div className="space-y-4">
          <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-black/10 dark:border-white/15 md:h-64">
            {item.photoUrl ? (
              <Image
                src={item.photoUrl}
                alt={item.nom}
                fill
                unoptimized
                sizes="100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                Aucune image
              </div>
            )}
          </div>

          <article className="space-y-3 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900">
            <h1 className="text-3xl font-bold">{item.nom}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              📍 {item.lieu} • {meta.category ?? 'Outdoor'}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Intensité{' '}
              {Math.min(5, Math.max(1, Math.floor(meta.intensity ?? 3)))}/5 •
              Durée {Math.max(1, Math.floor(meta.durationHours ?? 4))}h
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {visibleDescription(item.description) ||
                'Activité sportive encadrée pour tous niveaux.'}
            </p>
            <p className="text-lg font-bold">
              {formatXof(unitAmount)} / personne
            </p>
          </article>
        </div>

        <aside className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900">
          <h2 className="text-xl font-bold text-orange-500">Réserver</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Votre nom *</label>
              <input
                value={nom}
                onChange={(event) => setNom(event.target.value)}
                required
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Téléphone *</label>
              <input
                value={telephone}
                onChange={(event) => setTelephone(event.target.value)}
                required
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">
                Adresse / rendez-vous *
              </label>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                required
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Date de session *</label>
              <input
                type="datetime-local"
                value={serviceDate}
                onChange={(event) => setServiceDate(event.target.value)}
                required
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Participants *</label>
              <input
                type="number"
                min={1}
                value={participants}
                onChange={(event) =>
                  setParticipants(Math.max(1, Number(event.target.value) || 1))
                }
                required
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">
                Moyen de paiement *
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {paymentOptions.map((option) => {
                  const isSelected = paymentMethod === option.method;

                  return (
                    <button
                      key={option.method}
                      type="button"
                      onClick={() => setPaymentMethod(option.method)}
                      className={`min-w-52.5 rounded-2xl border p-3 text-left text-sm transition ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50 dark:border-cyan-400 dark:bg-cyan-900/20'
                          : 'border-black/10 bg-white dark:border-white/15 dark:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{option.title}</p>
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                            isSelected
                              ? 'bg-emerald-500 text-white'
                              : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {isSelected ? '✓' : '•'}
                        </span>
                      </div>
                      <p className="mt-2 font-medium">{option.account}</p>
                      <div className="mt-3 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{option.minLabel}</span>
                        <span>{option.maxLabel}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Notes (optionnel)</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              />
            </div>

            <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-800/60">
              <p>
                Total: <strong>{formatXof(totalAmount)}</strong>
              </p>
            </div>

            {submitError ? (
              <p className="text-sm text-red-600">{submitError}</p>
            ) : null}

            <button
              disabled={submitting}
              className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {submitting ? 'Réservation...' : 'Réserver maintenant'}
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}
