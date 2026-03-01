import { NextRequest, NextResponse } from 'next/server';
import { MediaType } from '@/app/generated/prisma/enums';
import { verifyAccessToken } from '@/lib/auth';
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
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'non authentifié' }, { status: 401 });
    }

    const auth = verifyAccessToken(token);

    if (!auth) {
      return NextResponse.json({ error: 'token invalide' }, { status: 401 });
    }

    if (auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
    }

    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: {
        id: true,
        date: true,
        participants: true,
        totalAmount: true,
        statut: true,
        paymentStatus: true,
        notes: true,
        tourist: {
          select: {
            nom: true,
            email: true,
          },
        },
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

    const parsedByBooking = bookings.map((booking) => ({
      booking,
      parsed: parseBookingNotes(booking.notes),
    }));

    const siteIds = parsedByBooking
      .map((item) => item.parsed.siteId)
      .filter((value): value is string => Boolean(value));
    const accommodationIds = parsedByBooking
      .map((item) => item.parsed.accommodationId)
      .filter((value): value is string => Boolean(value));
    const vehicleIds = parsedByBooking
      .map((item) => item.parsed.vehicleId)
      .filter((value): value is string => Boolean(value));
    const restaurantIds = parsedByBooking
      .map((item) => item.parsed.restaurantId)
      .filter((value): value is string => Boolean(value));

    const uniqueSiteIds = [...new Set(siteIds)];
    const uniqueAccommodationIds = [...new Set(accommodationIds)];
    const uniqueVehicleIds = [...new Set(vehicleIds)];
    const uniqueRestaurantIds = [...new Set(restaurantIds)];

    const [sites, accommodations, vehicles, restaurants] = await Promise.all([
      uniqueSiteIds.length
        ? prisma.touristSite.findMany({
            where: { id: { in: uniqueSiteIds } },
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
        : Promise.resolve([]),
      uniqueAccommodationIds.length
        ? prisma.accommodationListing.findMany({
            where: { id: { in: uniqueAccommodationIds } },
            select: { id: true, nom: true, photoUrl: true },
          })
        : Promise.resolve([]),
      uniqueVehicleIds.length
        ? prisma.vehicleRentalListing.findMany({
            where: { id: { in: uniqueVehicleIds } },
            select: { id: true, nom: true, photoUrl: true },
          })
        : Promise.resolve([]),
      uniqueRestaurantIds.length
        ? prisma.user.findMany({
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
        : Promise.resolve([]),
    ]);

    const siteMap = new Map(sites.map((site) => [site.id, site]));
    const accommodationMap = new Map(
      accommodations.map((item) => [item.id, item]),
    );
    const vehicleMap = new Map(vehicles.map((item) => [item.id, item]));
    const restaurantMap = new Map(restaurants.map((item) => [item.id, item]));

    const payload = parsedByBooking.map(({ booking, parsed }) => {
      const firstStop = booking.circuit?.stops[0];
      const noteSite = parsed.siteId ? siteMap.get(parsed.siteId) : null;
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
      let itemName = resolvedSite?.nom ?? 'Activité tourisme';
      let imageUrl = resolvedSite?.medias?.[0]?.url ?? '/envies/culturel.svg';
      let receiptPath = resolvedSite?.id
        ? `/tourisme/${resolvedSite.id}/recu`
        : null;

      if (accommodation) {
        entityType = 'HEBERGEMENT';
        itemName = accommodation.nom;
        imageUrl = accommodation.photoUrl ?? '/envies/culturel.svg';
        receiptPath = `/reservation/hebergement/${accommodation.id}/recu`;
      } else if (vehicle) {
        entityType = 'VEHICULE';
        itemName = vehicle.nom;
        imageUrl = vehicle.photoUrl ?? '/envies/culturel.svg';
        receiptPath = `/reservation/vehicule/${vehicle.id}/recu`;
      } else if (restaurant) {
        entityType = 'RESTAURATION';
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
        itemName = 'Hébergement';
        receiptPath = `/reservation/hebergement/${parsed.accommodationId}/recu`;
      } else if (parsed.bookingType === 'VEHICULE' && parsed.vehicleId) {
        entityType = 'VEHICULE';
        itemName = 'Véhicule';
        receiptPath = `/reservation/vehicule/${parsed.vehicleId}/recu`;
      } else if (parsed.bookingType === 'RESTAURANT' && parsed.restaurantId) {
        entityType = 'RESTAURATION';
        itemName = 'Restaurant';
        receiptPath = `/restauration/restaurant/${parsed.restaurantId}/recu`;
      } else if (parsed.bookingType === 'TOURISME' && parsed.siteId) {
        entityType = 'TOURISME';
        receiptPath = `/tourisme/${parsed.siteId}/recu`;
      }

      return {
        id: booking.id,
        date: booking.date,
        participants: booking.participants,
        totalAmount: Number(booking.totalAmount),
        statut: booking.statut,
        paymentStatus: booking.paymentStatus,
        touristName: booking.tourist?.nom ?? 'Touriste',
        touristEmail: booking.tourist?.email ?? null,
        entityType,
        itemName,
        imageUrl,
        receiptPath,
        paymentMethod: parsed.paymentMethod,
        paymentMethodLabel: paymentMethodLabel(parsed.paymentMethod),
      };
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error('GET /api/dashboard/admin-bookings', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
