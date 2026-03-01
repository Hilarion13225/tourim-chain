import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function toNumber(value: unknown) {
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return Number((value as { toString: () => string }).toString());
  }

  return Number(value ?? 0);
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const dishes = await prisma.restaurantDish.findMany({
      where: {
        restaurantId: id,
        disponible: true,
        stock: { gt: 0 },
      },
      select: {
        id: true,
        nom: true,
        prix: true,
        ville: true,
        cuisine: true,
        livraison: true,
        photoUrl: true,
        restaurant: {
          select: {
            id: true,
            nom: true,
            photo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!dishes.length) {
      return NextResponse.json(
        { error: 'restaurant introuvable' },
        { status: 404 },
      );
    }

    const first = dishes[0];
    const avgPrice =
      dishes.reduce((sum, item) => sum + toNumber(item.prix), 0) /
      Math.max(1, dishes.length);

    const payload = {
      id: first.restaurant.id,
      nom: first.restaurant.nom,
      ville: first.ville,
      cuisine: first.cuisine,
      livraison: dishes.some((item) => item.livraison),
      ticketMoyen: Math.round(avgPrice),
      note: 8.5,
      photoUrl:
        first.restaurant.photo ??
        dishes.find((item) => item.photoUrl)?.photoUrl ??
        null,
      popularDishes: dishes.slice(0, 3).map((item) => item.nom),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('GET /api/restaurants/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
