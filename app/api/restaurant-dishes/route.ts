import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function canManage(role: string) {
  return role === 'RESTAURANT' || role === 'ADMIN';
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      const dishes = await prisma.restaurantDish.findMany({
        where: { disponible: true, stock: { gt: 0 } },
        include: {
          restaurant: {
            select: {
              id: true,
              nom: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(dishes);
    }

    const auth = verifyAccessToken(token);

    if (!auth) {
      return NextResponse.json({ error: 'token invalide' }, { status: 401 });
    }

    if (!canManage(auth.role)) {
      const dishes = await prisma.restaurantDish.findMany({
        where: { disponible: true, stock: { gt: 0 } },
        include: {
          restaurant: {
            select: {
              id: true,
              nom: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(dishes);
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId') ?? undefined;

    const dishes = await prisma.restaurantDish.findMany({
      where:
        auth.role === 'ADMIN'
          ? {
              ...(restaurantId ? { restaurantId } : {}),
            }
          : {
              restaurantId: auth.userId,
            },
      include: {
        restaurant: {
          select: {
            id: true,
            nom: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(dishes);
  } catch (error) {
    console.error('GET /api/restaurant-dishes', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'non authentifié' }, { status: 401 });
    }

    const auth = verifyAccessToken(token);

    if (!auth) {
      return NextResponse.json({ error: 'token invalide' }, { status: 401 });
    }

    if (!canManage(auth.role)) {
      return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
    }

    const body = await request.json();
    const {
      nom,
      description,
      cuisine,
      ville,
      prix,
      spicyLevel,
      livraison,
      stock,
      disponible,
      photoUrl,
      restaurantId,
    } = body as {
      nom?: string;
      description?: string;
      cuisine?: string;
      ville?: string;
      prix?: number;
      spicyLevel?: number;
      livraison?: boolean;
      stock?: number;
      disponible?: boolean;
      photoUrl?: string;
      restaurantId?: string;
    };

    if (!nom || !cuisine || !ville || prix === undefined) {
      return NextResponse.json(
        {
          error: 'nom, cuisine, ville et prix sont requis',
        },
        { status: 400 },
      );
    }

    const dish = await prisma.restaurantDish.create({
      data: {
        restaurantId:
          auth.role === 'ADMIN' ? (restaurantId ?? auth.userId) : auth.userId,
        nom,
        description,
        cuisine,
        ville,
        prix: toNumber(prix, 0),
        spicyLevel: Math.min(
          5,
          Math.max(1, Math.floor(toNumber(spicyLevel, 1))),
        ),
        livraison: livraison ?? false,
        stock: Math.max(0, Math.floor(toNumber(stock, 0))),
        disponible: disponible ?? true,
        photoUrl,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            nom: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(dish, { status: 201 });
  } catch (error) {
    console.error('POST /api/restaurant-dishes', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
