'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type AdminReservationItem = {
  id: string;
  date: string;
  participants: number;
  totalAmount: number;
  statut: string;
  paymentStatus: string;
  touristName: string;
  touristEmail: string | null;
  entityType: 'TOURISME' | 'HEBERGEMENT' | 'VEHICULE' | 'RESTAURATION';
  itemName: string;
  imageUrl: string;
  receiptPath: string | null;
  paymentMethod: string | null;
  paymentMethodLabel: string;
};

function formatXof(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} XOF`;
}

export default function AdminReservationsList() {
  const [reservations, setReservations] = useState<AdminReservationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReservations() {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch('/api/dashboard/admin-bookings');
        const payload = (await response.json()) as
          | AdminReservationItem[]
          | { error?: string };

        if (!response.ok) {
          setError(
            (payload as { error?: string }).error ??
              'Erreur de chargement des réservations',
          );
          setReservations([]);
          return;
        }

        setReservations(payload as AdminReservationItem[]);
      } catch {
        setError('Erreur réseau, veuillez réessayer.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadReservations();
  }, []);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Réservations plateforme
        </h2>
        <p className="text-sm text-zinc-500">
          Visualisez les réservations avec photo et accès au reçu.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Chargement des réservations...</p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && reservations.length === 0 ? (
        <p className="rounded-2xl border border-black/10 p-4 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
          Aucune réservation disponible.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reservations.map((reservation) => {
          const unitAmount =
            reservation.participants > 0
              ? reservation.totalAmount / reservation.participants
              : reservation.totalAmount;

          const receiptParams = new URLSearchParams({
            bookingId: reservation.id,
            serviceDate: reservation.date,
            paymentMethod: reservation.paymentMethod ?? 'MOBILE_MONEY',
            totalAmount: String(reservation.totalAmount),
            issuedAt: new Date().toISOString(),
          });

          if (reservation.entityType === 'TOURISME') {
            receiptParams.set('siteName', reservation.itemName);
            receiptParams.set('participants', String(reservation.participants));
            receiptParams.set('unitAmount', String(unitAmount));
          }

          if (reservation.entityType === 'HEBERGEMENT') {
            receiptParams.set('accommodationName', reservation.itemName);
            receiptParams.set(
              'nights',
              String(Math.max(1, reservation.participants)),
            );
            receiptParams.set('unitAmount', String(unitAmount));
          }

          if (reservation.entityType === 'VEHICULE') {
            receiptParams.set('vehicleName', reservation.itemName);
            receiptParams.set(
              'rentalDays',
              String(Math.max(1, reservation.participants)),
            );
            receiptParams.set('unitAmount', String(unitAmount));
          }

          if (reservation.entityType === 'RESTAURATION') {
            receiptParams.set('restaurantName', reservation.itemName);
            receiptParams.set('participants', String(reservation.participants));
            receiptParams.set('unitAmount', String(unitAmount));
          }

          const receiptHref = reservation.receiptPath
            ? `${reservation.receiptPath}?${receiptParams.toString()}`
            : null;

          return (
            <article
              key={reservation.id}
              className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/15 dark:bg-zinc-950"
            >
              <div className="relative h-40 w-full bg-zinc-100 dark:bg-zinc-900">
                <Image
                  src={reservation.imageUrl}
                  alt={reservation.itemName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="space-y-2 p-4 text-sm text-zinc-700 dark:text-zinc-200">
                <p className="text-base font-semibold text-zinc-900 dark:text-white">
                  {reservation.itemName}
                </p>
                <p className="text-xs text-zinc-500">
                  Touriste: {reservation.touristName}
                  {reservation.touristEmail
                    ? ` • ${reservation.touristEmail}`
                    : ''}
                </p>
                <p>Référence: #{reservation.id}</p>
                <p>
                  Date: {new Date(reservation.date).toLocaleString('fr-FR')}
                </p>
                <p>Montant: {formatXof(reservation.totalAmount)}</p>
                <p>Paiement: {reservation.paymentMethodLabel}</p>
                <p>Statut: {reservation.statut}</p>

                {receiptHref ? (
                  <Link
                    href={receiptHref}
                    className="inline-flex rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
                  >
                    Voir mon reçu
                  </Link>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Reçu indisponible pour cette réservation.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
