'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type ReservationItem = {
  id: string;
  date: string;
  participants: number;
  totalAmount: number;
  statut: string;
  paymentStatus: string;
  entityType:
    | 'TOURISME'
    | 'HEBERGEMENT'
    | 'VEHICULE'
    | 'RESTAURATION'
    | 'PLAT'
    | 'SOUVENIR'
    | 'SPORT_ACTIVITE'
    | 'SPORT_EVENEMENT';
  entityId: string | null;
  itemName: string;
  imageUrl: string;
  receiptPath: string | null;
  paymentMethod: string | null;
  paymentMethodLabel: string;
};

type TouristDishOrder = {
  id: string;
  quantity: number;
  totalAmount: string | number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  dish: {
    id: string;
    nom: string;
    photoUrl?: string | null;
  };
  restaurant: {
    id: string;
    nom: string;
  };
};

type TouristSportOrder = {
  id: string;
  eventId: string;
  eventName: string;
  eventPhotoUrl?: string | null;
  itemType: 'ACTIVITY' | 'EVENT';
  participants: number;
  totalAmount: number;
  status: string;
  orderedAt: string;
  eventStartAt: string;
};

type TouristSouvenirOrder = {
  id: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  paymentReference?: string | null;
  product: {
    id: string;
    nom: string;
    photoUrl?: string | null;
  } | null;
  artisan: {
    id: string;
    nom: string;
  } | null;
  quantity: number;
  unitPrice: number;
};

type TouristeReservationsListProps = {
  userId: string;
};

function formatXof(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} XOF`;
}

function entityTypeLabel(type: ReservationItem['entityType']) {
  switch (type) {
    case 'TOURISME':
      return 'Tourisme';
    case 'HEBERGEMENT':
      return 'Hébergement';
    case 'VEHICULE':
      return 'Véhicule';
    case 'RESTAURATION':
      return 'Restaurant';
    case 'PLAT':
      return 'Plat';
    case 'SOUVENIR':
      return 'Souvenir';
    case 'SPORT_ACTIVITE':
      return 'Sport • Activité';
    case 'SPORT_EVENEMENT':
      return 'Sport • Événement';
  }
}

export default function TouristeReservationsList({
  userId,
}: TouristeReservationsListProps) {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReservations() {
      setIsLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({ touristId: userId });
        const bookingsResponse = await fetch(
          `/api/dashboard/tourist-bookings?${params.toString()}`,
        );
        const bookingsPayload = (await bookingsResponse.json()) as
          | ReservationItem[]
          | { error?: string };

        if (!bookingsResponse.ok) {
          setError(
            (bookingsPayload as { error?: string }).error ??
              'Erreur de chargement des réservations',
          );
          setReservations([]);
          return;
        }

        const dishOrdersResponse = await fetch('/api/restaurant-orders');
        const dishOrdersPayload = (await dishOrdersResponse.json()) as
          | TouristDishOrder[]
          | { error?: string };

        if (!dishOrdersResponse.ok) {
          setError(
            (dishOrdersPayload as { error?: string }).error ??
              'Erreur de chargement des commandes plats',
          );
          setReservations(bookingsPayload as ReservationItem[]);
          return;
        }

        const dishReservations = (dishOrdersPayload as TouristDishOrder[]).map(
          (order) => ({
            id: order.id,
            date: order.createdAt,
            participants: order.quantity,
            totalAmount: Number(order.totalAmount),
            statut: order.status,
            paymentStatus: order.paymentStatus,
            entityType: 'PLAT' as const,
            entityId: order.dish.id,
            itemName: `${order.dish.nom} • ${order.restaurant.nom}`,
            imageUrl: order.dish.photoUrl ?? '/envies/culturel.svg',
            receiptPath: `/restauration/plat/${order.dish.id}/recu`,
            paymentMethod: null,
            paymentMethodLabel: 'Non précisé',
          }),
        );

        const sportOrdersResponse = await fetch('/api/events/orders');
        const sportOrdersPayload = (await sportOrdersResponse.json()) as
          | TouristSportOrder[]
          | { error?: string };

        if (!sportOrdersResponse.ok) {
          setError(
            (sportOrdersPayload as { error?: string }).error ??
              'Erreur de chargement des réservations sport',
          );
          setReservations([
            ...(bookingsPayload as ReservationItem[]),
            ...(dishReservations as ReservationItem[]),
          ]);
          return;
        }

        const sportReservations = (
          sportOrdersPayload as TouristSportOrder[]
        ).map((order) => ({
          id: order.id,
          date: order.orderedAt,
          participants: Math.max(1, order.participants),
          totalAmount: Number(order.totalAmount),
          statut: order.status,
          paymentStatus: order.status,
          entityType:
            order.itemType === 'ACTIVITY'
              ? ('SPORT_ACTIVITE' as const)
              : ('SPORT_EVENEMENT' as const),
          entityId: order.eventId,
          itemName: order.eventName,
          imageUrl: order.eventPhotoUrl ?? '/envies/culturel.svg',
          receiptPath:
            order.itemType === 'ACTIVITY'
              ? `/sport/activite/${order.eventId}/recu`
              : `/sport/evenement/${order.eventId}/recu`,
          paymentMethod: null,
          paymentMethodLabel: 'Non précisé',
        }));

        const souvenirOrdersResponse = await fetch('/api/marketplace/orders');
        const souvenirOrdersPayload = (await souvenirOrdersResponse.json()) as
          | TouristSouvenirOrder[]
          | { error?: string };

        if (!souvenirOrdersResponse.ok) {
          setError(
            (souvenirOrdersPayload as { error?: string }).error ??
              'Erreur de chargement des achats souvenirs',
          );
          setReservations([
            ...(bookingsPayload as ReservationItem[]),
            ...(dishReservations as ReservationItem[]),
            ...(sportReservations as ReservationItem[]),
          ]);
          return;
        }

        const souvenirReservations = (
          souvenirOrdersPayload as TouristSouvenirOrder[]
        ).map((order) => ({
          id: order.id,
          date: order.createdAt,
          participants: Math.max(1, order.quantity),
          totalAmount: Number(order.totalAmount),
          statut: order.status,
          paymentStatus: order.paymentStatus,
          entityType: 'SOUVENIR' as const,
          entityId: order.product?.id ?? null,
          itemName: order.artisan
            ? `${order.product?.nom ?? 'Souvenir'} • ${order.artisan.nom}`
            : (order.product?.nom ?? 'Souvenir'),
          imageUrl: order.product?.photoUrl ?? '/envies/culturel.svg',
          receiptPath: order.product?.id
            ? `/article/souvenir/${order.product.id}/recu`
            : null,
          paymentMethod: null,
          paymentMethodLabel: order.paymentReference ?? 'Non précisé',
        }));

        const merged = [
          ...(bookingsPayload as ReservationItem[]),
          ...dishReservations,
          ...sportReservations,
          ...souvenirReservations,
        ].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        setReservations(merged);
      } catch {
        setError('Erreur réseau, veuillez réessayer.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadReservations();
  }, [userId]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Mes réservations
        </h2>
        <p className="text-sm text-zinc-500">
          Retrouvez vos réservations avec visuel et accès rapide au reçu.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Chargement des réservations...</p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && reservations.length === 0 ? (
        <p className="rounded-2xl border border-black/10 p-4 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
          Aucune réservation pour le moment.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {reservations.map((reservation) => {
          const unitAmount =
            reservation.participants > 0
              ? reservation.totalAmount / reservation.participants
              : reservation.totalAmount;

          const receiptParams = new URLSearchParams({
            bookingId: reservation.id,
            serviceDate: reservation.date,
            paymentMethod: reservation.paymentMethod ?? '',
            paymentMethodLabel: reservation.paymentMethodLabel,
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
            receiptParams.set(
              'participants',
              String(Math.max(1, reservation.participants)),
            );
            receiptParams.set('unitAmount', String(unitAmount));
          }

          if (reservation.entityType === 'PLAT') {
            const [dishName, restaurantName] = reservation.itemName
              .split(' • ')
              .map((value) => value.trim());
            receiptParams.set('orderId', reservation.id);
            receiptParams.set('dishId', reservation.entityId ?? '');
            receiptParams.set('dishName', dishName || reservation.itemName);
            receiptParams.set('restaurantName', restaurantName || 'Restaurant');
            receiptParams.set(
              'quantity',
              String(Math.max(1, reservation.participants)),
            );
            receiptParams.set('unitAmount', String(unitAmount));
          }

          if (reservation.entityType === 'SPORT_ACTIVITE') {
            receiptParams.set('orderId', reservation.id);
            receiptParams.set('activityId', reservation.entityId ?? '');
            receiptParams.set('activityName', reservation.itemName);
            receiptParams.set(
              'participants',
              String(Math.max(1, reservation.participants)),
            );
            receiptParams.set('unitAmount', String(unitAmount));
          }

          if (reservation.entityType === 'SPORT_EVENEMENT') {
            receiptParams.set('orderId', reservation.id);
            receiptParams.set('eventId', reservation.entityId ?? '');
            receiptParams.set('eventName', reservation.itemName);
            receiptParams.set(
              'participants',
              String(Math.max(1, reservation.participants)),
            );
            receiptParams.set('unitAmount', String(unitAmount));
          }

          if (reservation.entityType === 'SOUVENIR') {
            const [productName, artisanName] = reservation.itemName
              .split(' • ')
              .map((value) => value.trim());
            receiptParams.set('orderId', reservation.id);
            receiptParams.set('productId', reservation.entityId ?? '');
            receiptParams.set(
              'productName',
              productName || reservation.itemName,
            );
            receiptParams.set('artisanName', artisanName || 'Artisan');
            receiptParams.set(
              'quantity',
              String(Math.max(1, reservation.participants)),
            );
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
              <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-900">
                <Image
                  src={reservation.imageUrl}
                  alt={reservation.itemName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="space-y-2 p-4 text-sm text-zinc-700 dark:text-zinc-200">
                <p className="w-fit rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {entityTypeLabel(reservation.entityType)}
                </p>
                <p className="text-base font-semibold text-zinc-900 dark:text-white">
                  {reservation.itemName}
                </p>
                <p>Référence: #{reservation.id}</p>
                <p>
                  Date: {new Date(reservation.date).toLocaleString('fr-FR')}
                </p>
                <p>Participants: {reservation.participants}</p>
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
