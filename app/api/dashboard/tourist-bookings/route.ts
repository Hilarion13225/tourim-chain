import { NextRequest, NextResponse } from 'next/server';
import { MediaType } from '@/app/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

type ParsedBookingNotes = {
  bookingType: string | null;
  siteId: string | null;
  accommodationId: string | null;
  vehicleId: string | null;
  restaurantId: string | null;
  paymentMethod: string | null;
};

function parseBookingNotes(notes: string | null): ParsedBookingNotes {
  if (!notes) {
    return {
      bookingType: null,
      siteId: null,
      accommodationId: null,
      vehicleId: null,
      restaurantId: null,
      paymentMethod: null,
    };
  }

  const typeMatch = notes.match(/(?:^|\|)\s*Type:\s*([^|]+)/i);
  const siteMatch = notes.match(/(?:^|\|)\s*Site:\s*([^|]+)/i);
  const accommodationMatch = notes.match(
    /(?:^|\|)\s*Accommodation:\s*([^|]+)/i,
  );
  const vehicleMatch = notes.match(/(?:^|\|)\s*Vehicle:\s*([^|]+)/i);
  const restaurantMatch = notes.match(/(?:^|\|)\s*Restaurant:\s*([^|]+)/i);
  const paymentMatch = notes.match(/(?:^|\|)\s*Paiement:\s*([^|]+)/i);

  return {
    bookingType: typeMatch?.[1]?.trim() ?? null,
    siteId: siteMatch?.[1]?.trim() ?? null,
    accommodationId: accommodationMatch?.[1]?.trim() ?? null,
    vehicleId: vehicleMatch?.[1]?.trim() ?? null,
    restaurantId: restaurantMatch?.[1]?.trim() ?? null,
    paymentMethod: paymentMatch?.[1]?.trim() ?? null,
  };
}

function paymentMethodLabel(method: string | null) {
  switch (method) {
    case 'MOBILE_MONEY':
      return 'Mobile Money';
    case 'CARD':
      return 'Carte bancaire';
    case 'BANK_TRANSFER':
      return 'Virement bancaire';
    case 'CASH_ON_SERVICE':
      return 'Paiement sur place';
    default:
      return 'Non précisé';
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const touristId = searchParams.get('touristId');

    if (!touristId) {
      return NextResponse.json(
        { error: 'touristId est requis' },
        { status: 400 },
      );
    }

    const bookings = await prisma.booking.findMany({
      where: { touristId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        date: true,
        participants: true,
        totalAmount: true,
        statut: true,
        paymentStatus: true,
        notes: true,
        circuit: {
          select: {
            stops: {
              orderBy: { ordre: 'asc' },
              take: 1,
              select: {
                site: {
                  select: {
                    id: true,
                    nom: true,
                    medias: {
                      where: { type: MediaType.IMAGE },
                      orderBy: { createdAt: 'asc' },
                      take: 1,
                      select: { url: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const noteSiteIds = bookings
      .map((booking) => parseBookingNotes(booking.notes).siteId)
      .filter((value): value is string => Boolean(value));

    const uniqueNoteSiteIds = [...new Set(noteSiteIds)];

    const noteAccommodationIds = bookings
      .map((booking) => parseBookingNotes(booking.notes).accommodationId)
      .filter((value): value is string => Boolean(value));

    const uniqueAccommodationIds = [...new Set(noteAccommodationIds)];

    const noteVehicleIds = bookings
      .map((booking) => parseBookingNotes(booking.notes).vehicleId)
      .filter((value): value is string => Boolean(value));

    const uniqueVehicleIds = [...new Set(noteVehicleIds)];

    const noteRestaurantIds = bookings
      .map((booking) => parseBookingNotes(booking.notes).restaurantId)
      .filter((value): value is string => Boolean(value));

    const uniqueRestaurantIds = [...new Set(noteRestaurantIds)];

    const noteSites = uniqueNoteSiteIds.length
      ? await prisma.touristSite.findMany({
          where: {
            id: {
              in: uniqueNoteSiteIds,
            },
          },
          select: {
            id: true,
            nom: true,
            medias: {
              where: { type: MediaType.IMAGE },
              orderBy: { createdAt: 'asc' },
              take: 1,
              select: { url: true },
            },
          },
        })
      : [];

    const noteSiteMap = new Map(noteSites.map((site) => [site.id, site]));

    const accommodations = uniqueAccommodationIds.length
      ? await prisma.accommodationListing.findMany({
          where: {
            id: {
              in: uniqueAccommodationIds,
            },
          },
          select: {
            id: true,
            nom: true,
            photoUrl: true,
          },
        })
      : [];

    const accommodationMap = new Map(
      accommodations.map((accommodation) => [accommodation.id, accommodation]),
    );

    const vehicles = uniqueVehicleIds.length
      ? await prisma.vehicleRentalListing.findMany({
          where: {
            id: {
              in: uniqueVehicleIds,
            },
          },
          select: {
            id: true,
            nom: true,
            photoUrl: true,
          },
        })
      : [];

    const vehicleMap = new Map(
      vehicles.map((vehicle) => [vehicle.id, vehicle]),
    );

    const restaurants = uniqueRestaurantIds.length
      ? await prisma.user.findMany({
          where: {
            id: { in: uniqueRestaurantIds },
            role: 'RESTAURANT',
          },
          select: {
            id: true,
            nom: true,
            photo: true,
            restaurantDishesOwned: {
              where: {
                photoUrl: {
                  not: null,
                },
              },
              orderBy: { createdAt: 'asc' },
              take: 1,
              select: { photoUrl: true },
            },
          },
        })
      : [];

    const restaurantMap = new Map(
      restaurants.map((restaurant) => [restaurant.id, restaurant]),
    );

    const payload = bookings.map((booking) => {
      const parsed = parseBookingNotes(booking.notes);
      const firstStop = booking.circuit?.stops[0];

      const noteSite = parsed.siteId ? noteSiteMap.get(parsed.siteId) : null;
      const resolvedSite = firstStop?.site ?? noteSite;

      const accommodation = parsed.accommodationId
        ? accommodationMap.get(parsed.accommodationId)
        : null;
      const vehicle = parsed.vehicleId
        ? vehicleMap.get(parsed.vehicleId)
        : null;
      const restaurant = parsed.restaurantId
        ? restaurantMap.get(parsed.restaurantId)
        : null;

      let entityType: 'TOURISME' | 'HEBERGEMENT' | 'VEHICULE' | 'RESTAURATION' =
        'TOURISME';
      let entityId: string | null = resolvedSite?.id ?? parsed.siteId ?? null;
      let itemName = resolvedSite?.nom ?? 'Activité tourisme';
      let imageUrl = resolvedSite?.medias?.[0]?.url ?? '/envies/culturel.svg';
      let receiptPath = entityId ? `/tourisme/${entityId}/recu` : null;

      if (accommodation) {
        entityType = 'HEBERGEMENT';
        entityId = accommodation.id;
        itemName = accommodation.nom;
        imageUrl = accommodation.photoUrl ?? '/envies/culturel.svg';
        receiptPath = `/reservation/hebergement/${accommodation.id}/recu`;
      } else if (vehicle) {
        entityType = 'VEHICULE';
        entityId = vehicle.id;
        itemName = vehicle.nom;
        imageUrl = vehicle.photoUrl ?? '/envies/culturel.svg';
        receiptPath = `/reservation/vehicule/${vehicle.id}/recu`;
      } else if (restaurant) {
        entityType = 'RESTAURATION';
        entityId = restaurant.id;
        itemName = restaurant.nom;
        imageUrl =
          restaurant.photo ??
          restaurant.restaurantDishesOwned[0]?.photoUrl ??
          '/envies/culturel.svg';
        receiptPath = `/restauration/restaurant/${restaurant.id}/recu`;
      } else if (
        parsed.bookingType === 'HEBERGEMENT' &&
        parsed.accommodationId
      ) {
        entityType = 'HEBERGEMENT';
        entityId = parsed.accommodationId;
        itemName = 'Hébergement';
        imageUrl = '/envies/culturel.svg';
        receiptPath = `/reservation/hebergement/${parsed.accommodationId}/recu`;
      } else if (parsed.bookingType === 'VEHICULE' && parsed.vehicleId) {
        entityType = 'VEHICULE';
        entityId = parsed.vehicleId;
        itemName = 'Véhicule';
        imageUrl = '/envies/culturel.svg';
        receiptPath = `/reservation/vehicule/${parsed.vehicleId}/recu`;
      } else if (parsed.bookingType === 'RESTAURANT' && parsed.restaurantId) {
        entityType = 'RESTAURATION';
        entityId = parsed.restaurantId;
        itemName = 'Restaurant';
        imageUrl = '/envies/culturel.svg';
        receiptPath = `/restauration/restaurant/${parsed.restaurantId}/recu`;
      }

      return {
        id: booking.id,
        date: booking.date,
        participants: booking.participants,
        totalAmount: Number(booking.totalAmount),
        statut: booking.statut,
        paymentStatus: booking.paymentStatus,
        entityType,
        entityId,
        itemName,
        imageUrl,
        receiptPath,
        paymentMethod: parsed.paymentMethod,
        paymentMethodLabel: paymentMethodLabel(parsed.paymentMethod),
      };
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error('GET /api/dashboard/tourist-bookings', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
