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

type DishDetail = {
  id: string;
  nom: string;
  description?: string | null;
  cuisine: string;
  ville: string;
  prix: string;
  spicyLevel: number;
  livraison: boolean;
  stock: number;
  disponible: boolean;
  photoUrl?: string | null;
  restaurant: {
    id: string;
    nom: string;
    photo?: string | null;
  };
};

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
    account: 'Règlement au restaurant',
    minLabel: 'Min 300 F',
    maxLabel: 'Max 2 000 000 F',
  },
];

export default function PlatReservationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dishId = params?.id;

  const [item, setItem] = useState<DishDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!dishId) return;

    let active = true;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const authResponse = await fetch('/api/auth/me');

        if (!authResponse.ok) {
          if (!active) return;
          const returnTo = encodeURIComponent(`/restauration/plat/${dishId}`);
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

        if (!active) return;

        setNom(authData.user?.nom ?? '');
        setEmail(authData.user?.email ?? '');
        setTelephone(authData.user?.phone ?? '');

        const response = await fetch(`/api/restaurant-dishes/${dishId}`);
        const data = (await response.json()) as DishDetail | { error?: string };

        if (!response.ok) {
          if (!active) return;
          setError((data as { error?: string }).error ?? 'Plat introuvable');
          setItem(null);
          return;
        }

        setItem(data as DishDetail);
      } catch {
        if (!active) return;
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
  }, [dishId, router]);

  const unitAmount = useMemo(() => Number(item?.prix ?? 0), [item?.prix]);
  const safeQuantity = Math.max(1, Math.min(quantity, item?.stock ?? quantity));
  const totalAmount = safeQuantity * unitAmount;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!item) return;

    if (!paymentMethod) {
      setSubmitError('Veuillez choisir un moyen de paiement.');
      return;
    }

    const selectedPaymentOption = paymentOptions.find(
      (option) => option.method === paymentMethod,
    );

    setSubmitError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/restaurant-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishId: item.id,
          quantity: safeQuantity,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        orderId?: string;
        totalAmount?: number;
      };

      if (!response.ok) {
        if (response.status === 401) {
          const returnTo = encodeURIComponent(`/restauration/plat/${item.id}`);
          router.push(`/login?returnTo=${returnTo}`);
          return;
        }

        setSubmitError(data.error ?? 'Commande impossible.');
        return;
      }

      const paymentParams = new URLSearchParams({
        orderId: data.orderId ?? 'N/A',
        dishId: item.id,
        dishName: item.nom,
        restaurantId: item.restaurant.id,
        restaurantName: item.restaurant.nom,
        fullName: nom,
        phone: telephone,
        email,
        address,
        serviceDate,
        paymentMethod,
        paymentMethodLabel: selectedPaymentOption?.title ?? paymentMethod,
        quantity: String(safeQuantity),
        unitAmount: String(unitAmount),
        totalAmount: String(Number(data.totalAmount ?? totalAmount)),
        notes,
      });

      router.push(
        `/restauration/plat/${item.id}/paiement?${paymentParams.toString()}`,
      );
    } catch {
      setSubmitError('Erreur réseau pendant la commande.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
        <p className="text-sm text-zinc-500">Chargement de la commande...</p>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="mx-auto w-full max-w-7xl space-y-4 px-6 py-10 lg:px-10">
        <p className="text-sm text-red-600">{error || 'Plat introuvable.'}</p>
        <Link
          href="/restauration"
          className="inline-flex rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
        >
          Retour à la restauration
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8 lg:px-10">
      <p className="text-xs text-zinc-500">
        <Link href="/restauration" className="hover:underline">
          Restauration
        </Link>{' '}
        {'>'} Plat {'>'}{' '}
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
              {item.restaurant.nom} • {item.cuisine} • 📍 {item.ville}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Épicé {item.spicyLevel}/5 •{' '}
              {item.livraison ? 'Livraison possible' : 'Sur place uniquement'}
            </p>
            {item.description ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {item.description}
              </p>
            ) : null}
            <p className="text-sm text-zinc-500">
              Stock disponible: {item.stock}
            </p>
            <p className="text-lg font-bold">{formatXof(unitAmount)} / plat</p>
          </article>
        </div>

        <aside className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900">
          <h2 className="text-xl font-bold text-orange-500">Commander</h2>
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
                Adresse / localisation *
              </label>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                required
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">
                Date de commande *
              </label>
              <input
                type="datetime-local"
                value={serviceDate}
                onChange={(event) => setServiceDate(event.target.value)}
                required
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Quantité *</label>
              <input
                type="number"
                min={1}
                max={Math.max(1, item.stock)}
                value={safeQuantity}
                onChange={(event) =>
                  setQuantity(Math.max(1, Number(event.target.value) || 1))
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
              disabled={submitting || item.stock <= 0}
              className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {submitting ? 'Traitement...' : 'Commander maintenant'}
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}
