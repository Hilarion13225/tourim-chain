import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function toNumber(value: unknown) {
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return Number((value as { toString: () => string }).toString());
  }

  return Number(value ?? 0);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');

    if (!role || !userId) {
      return NextResponse.json(
        { error: 'role et userId sont requis' },
        { status: 400 },
      );
    }

    if (role === 'TOURIST') {
      const [voyages, billetsNft, favoris] = await Promise.all([
        prisma.booking.count({ where: { touristId: userId } }),
        prisma.blockchainAsset.count({ where: { ownerId: userId } }),
        prisma.favoriteSite.count({ where: { touristId: userId } }),
      ]);

      return NextResponse.json({ voyages, billetsNft, favoris });
    }

    if (role === 'GUIDE') {
      const [reservations, revenusAgg, creneaux] = await Promise.all([
        prisma.booking.count({ where: { guideId: userId } }),
        prisma.booking.aggregate({
          where: { guideId: userId },
          _sum: { totalAmount: true },
        }),
        prisma.guideAvailability.count({
          where: {
            guideProfile: { userId },
          },
        }),
      ]);

      return NextResponse.json({
        reservations,
        revenus: toNumber(revenusAgg._sum.totalAmount),
        creneaux,
      });
    }

    if (role === 'ARTISAN') {
      const [produits, commandes, certificats] = await Promise.all([
        prisma.artisanProduct.count({ where: { artisanId: userId } }),
        prisma.marketplaceOrderItem.count({
          where: {
            product: { artisanId: userId },
          },
        }),
        prisma.certification.count({ where: { artisanId: userId } }),
      ]);

      return NextResponse.json({ produits, commandes, certificats });
    }

    if (role === 'ORGANIZER') {
      const [evenements, scans] = await Promise.all([
        prisma.event.count({ where: { organisateurId: userId } }),
        prisma.ticketScan.count({ where: { scannerId: userId } }),
      ]);

      return NextResponse.json({ evenements, scans });
    }

    if (role === 'ACCOMMODATION_COMPANY') {
      const [hebergements, hebergementsActifs] = await Promise.all([
        prisma.accommodationListing.count({ where: { ownerId: userId } }),
        prisma.accommodationListing.count({
          where: { ownerId: userId, isActive: true },
        }),
      ]);

      return NextResponse.json({ hebergements, hebergementsActifs });
    }

    if (role === 'VEHICLE_RENTAL_COMPANY') {
      const [vehicules, vehiculesDisponibles] = await Promise.all([
        prisma.vehicleRentalListing.count({ where: { ownerId: userId } }),
        prisma.vehicleRentalListing.count({
          where: { ownerId: userId, disponible: true },
        }),
      ]);

      return NextResponse.json({ vehicules, vehiculesDisponibles });
    }

    if (role === 'ADMIN') {
      const [validationActeurs, analyticsNationaux] = await Promise.all([
        prisma.user.count({ where: { verified: false } }),
        prisma.booking.count(),
      ]);

      return NextResponse.json({ validationActeurs, analyticsNationaux });
    }

    return NextResponse.json({ error: 'role invalide' }, { status: 400 });
  } catch (error) {
    console.error('GET /api/dashboard/summary', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
