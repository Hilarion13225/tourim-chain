'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type SiteMedia = {
  id: string;
  url: string;
  type: string;
};

type SiteReview = {
  id: string;
  note: number;
  commentaire: string;
};

type SiteDetail = {
  id: string;
  nom: string;
  region: string;
  description: string;
  categorieTourisme: string;
  medias: SiteMedia[];
  reviews: SiteReview[];
};

type GuidePrincipal = {
  id: string;
  nom: string;
  email: string;
};

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

function formatXof(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} XOF`;
}

function mapCategoryLabel(category: string) {
  switch (category) {
    case 'CULTURE':
    case 'HERITAGE':
    case 'RELIGIOUS':
      return 'Tourisme culturel';
    case 'BEACH':
      return 'Tourisme balnéaire';
    case 'NATURE':
      return 'Tourisme écotourisme';
    default:
      return 'Tourisme urban';
  }
}

function parseTourismMeta(description: string) {
  const fallback = {
    summary: description,
    priceXof: 18000,
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
    account: 'Règlement à l’arrivée',
    minLabel: 'Min 300 F',
    maxLabel: 'Max 2 000 000 F',
  },
];

export default function TourismeDetailReservationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const siteId = params?.id;

  const [site, setSite] = useState<SiteDetail | null>(null);
  const [principalGuide, setPrincipalGuide] = useState<GuidePrincipal | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dateService, setDateService] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [participants, setParticipants] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    if (!siteId) {
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

          const returnTo = encodeURIComponent(`/tourisme/${siteId}`);
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

        const [siteResponse, guideResponse] = await Promise.all([
          fetch(`/api/sites/${siteId}`),
          fetch(`/api/sites/${siteId}/guides`),
        ]);

        const siteData = (await siteResponse.json()) as
          | SiteDetail
          | { error?: string };

        if (!siteResponse.ok) {
          if (!active) {
            return;
          }
          setError(
            (siteData as { error?: string }).error ?? 'Site introuvable',
          );
          setSite(null);
          setPrincipalGuide(null);
          return;
        }

        const guideData = (await guideResponse.json()) as
          | GuidePrincipal[]
          | { error?: string };

        if (!active) {
          return;
        }

        setSite(siteData as SiteDetail);
        setPrincipalGuide(
          guideResponse.ok
            ? ((guideData as GuidePrincipal[])[0] ?? null)
            : null,
        );
      } catch {
        if (!active) {
          return;
        }
        setError('Erreur réseau pendant le chargement.');
        setSite(null);
        setPrincipalGuide(null);
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
  }, [router, siteId]);

  const details = useMemo(() => {
    if (!site) {
      return null;
    }

    const meta = parseTourismMeta(site.description);
    const image = site.medias.find((media) => media.type === 'IMAGE')?.url;
    const averageRating =
      site.reviews.length > 0
        ? site.reviews.reduce((sum, review) => sum + review.note, 0) /
          site.reviews.length
        : null;

    return {
      summary: meta.summary,
      priceXof: meta.priceXof,
      durationHours: meta.durationHours,
      image,
      categoryLabel: mapCategoryLabel(site.categorieTourisme),
      averageRating,
      reviewCount: site.reviews.length,
    };
  }, [site]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!site || !siteId || !details) {
      return;
    }

    if (!paymentMethod) {
      setSubmitError('Veuillez choisir un moyen de paiement.');
      return;
    }

    const selectedPaymentOption = paymentOptions.find(
      (option) => option.method === paymentMethod,
    );

    setSubmitError('');
    setSubmitSuccess('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/bookings/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          participants,
          date: dateService,
          fullName: nom,
          phone: telephone,
          email,
          address,
          paymentMethod,
          notes: `Type: TOURISME | Site: ${siteId} | Paiement: ${
            selectedPaymentOption?.title ?? paymentMethod
          }${notes ? ` | Notes client: ${notes}` : ''}`,
          amount: details.priceXof,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        booking?: {
          id?: string;
          totalAmount?: number;
          date?: string;
          participants?: number;
        };
      };

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }

        setSubmitError(data.error ?? 'Réservation impossible.');
        return;
      }

      setSubmitSuccess(
        `Réservation confirmée (#${data.booking?.id ?? 'N/A'}).`,
      );

      const bookingId = data.booking?.id ?? 'N/A';
      const totalAmount = Number(data.booking?.totalAmount ?? 0);
      const resolvedParticipants = Number(
        data.booking?.participants ?? participants,
      );

      const paymentParams = new URLSearchParams({
        bookingId,
        siteName: site.nom,
        fullName: nom,
        serviceDate: data.booking?.date ?? dateService,
        paymentMethod,
        paymentMethodLabel: selectedPaymentOption?.title ?? paymentMethod,
        participants: String(resolvedParticipants),
        unitAmount: String(details.priceXof),
        totalAmount: String(totalAmount),
      });

      router.push(`/tourisme/${siteId}/paiement?${paymentParams.toString()}`);
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

  if (error || !site || !details) {
    return (
      <main className="mx-auto w-full max-w-7xl space-y-4 px-6 py-10 lg:px-10">
        <p className="text-sm text-red-600">{error || 'Site introuvable.'}</p>
        <Link
          href="/tourisme"
          className="inline-flex rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
        >
          Retour au tourisme
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8 lg:px-10">
      <p className="text-xs text-zinc-500">
        <Link href="/" className="hover:underline">
          Accueil
        </Link>{' '}
        {'>'}{' '}
        <Link href="/tourisme" className="hover:underline">
          Secteurs
        </Link>{' '}
        {'>'}{' '}
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
          {site.nom}
        </span>
      </p>

      <section className="grid gap-6 lg:grid-cols-[1fr_330px]">
        <div className="space-y-4">
          <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-black/10 dark:border-white/15 md:h-64">
            {details.image ? (
              <Image
                src={details.image}
                alt={site.nom}
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

          <article className="space-y-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900">
            <p className="text-xs text-orange-500">Proposé par</p>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-3xl font-bold">{site.nom}</h1>
              {details.averageRating ? (
                <p className="text-sm font-semibold text-orange-500">
                  ★ {details.averageRating.toFixed(1)} ({details.reviewCount})
                </p>
              ) : null}
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {details.categoryLabel}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {details.summary}
            </p>

            <div className="grid gap-2 md:grid-cols-4">
              <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-zinc-800/60">
                <p className="text-lg font-bold">
                  {formatXof(details.priceXof)}
                </p>
                <p className="text-xs text-zinc-500">Tarif</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-zinc-800/60">
                <p className="text-lg font-bold">{details.durationHours}h</p>
                <p className="text-xs text-zinc-500">Durée</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-zinc-800/60">
                <p className="text-sm font-bold">
                  {principalGuide?.nom ?? 'Auto'}
                </p>
                <p className="text-xs text-zinc-500">Guide principal</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-zinc-800/60">
                <p className="text-lg font-bold">{details.reviewCount}</p>
                <p className="text-xs text-zinc-500">Avis</p>
              </div>
            </div>
          </article>

          <section className="space-y-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Avis des clients</h2>
              <span className="text-xs text-zinc-500">
                {details.reviewCount} avis
              </span>
            </div>
            {site.reviews.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Aucun avis pour le moment. Soyez le premier à donner votre avis
                après utilisation de ce service !
              </p>
            ) : (
              <div className="space-y-2">
                {site.reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
                  >
                    <p className="font-semibold text-orange-500">
                      ★ {review.note}/10
                    </p>
                    <p>{review.commentaire}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
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
                Adresse de livraison / Lieu de RDV
              </label>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Date du service *</label>
              <input
                type="date"
                value={dateService}
                onChange={(event) => setDateService(event.target.value)}
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
              <label className="text-xs font-semibold">
                Nombre de personnes
              </label>
              <input
                type="number"
                min={1}
                value={participants}
                onChange={(event) =>
                  setParticipants(Number(event.target.value) || 1)
                }
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              />
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

            {submitError ? (
              <p className="text-sm text-red-600">{submitError}</p>
            ) : null}
            {submitSuccess ? (
              <p className="text-sm text-emerald-600">{submitSuccess}</p>
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
