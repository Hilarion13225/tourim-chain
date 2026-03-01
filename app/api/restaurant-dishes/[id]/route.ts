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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const token = request.cookies.get('auth_token')?.value;

    const dish = await prisma.restaurantDish.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            nom: true,
            email: true,
            photo: true,
          },
        },
      },
    });

    if (!dish) {
      return NextResponse.json({ error: 'plat introuvable' }, { status: 404 });
    }

    if (dish.disponible && dish.stock > 0) {
      return NextResponse.json(dish);
    }

    if (!token) {
      return NextResponse.json({ error: 'plat introuvable' }, { status: 404 });
    }

    const auth = verifyAccessToken(token);

    if (!auth) {
      return NextResponse.json({ error: 'token invalide' }, { status: 401 });
    }

    if (auth.role === 'ADMIN' || dish.restaurantId === auth.userId) {
      return NextResponse.json(dish);
    }

    return NextResponse.json({ error: 'plat introuvable' }, { status: 404 });
  } catch (error) {
    console.error('GET /api/restaurant-dishes/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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

    const { id } = await context.params;

    const existing = await prisma.restaurantDish.findUnique({
      where: { id },
      select: { id: true, restaurantId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'plat introuvable' }, { status: 404 });
    }

    if (auth.role !== 'ADMIN' && existing.restaurantId !== auth.userId) {
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
    };

    const dish = await prisma.restaurantDish.update({
      where: { id },
      data: {
        ...(nom !== undefined ? { nom } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(cuisine !== undefined ? { cuisine } : {}),
        ...(ville !== undefined ? { ville } : {}),
        ...(prix !== undefined ? { prix: toNumber(prix, 0) } : {}),
        ...(spicyLevel !== undefined
          ? {
              spicyLevel: Math.min(
                5,
                Math.max(1, Math.floor(toNumber(spicyLevel, 1))),
              ),
            }
          : {}),
        ...(livraison !== undefined ? { livraison } : {}),
        ...(stock !== undefined
          ? { stock: Math.max(0, Math.floor(toNumber(stock, 0))) }
          : {}),
        ...(disponible !== undefined ? { disponible } : {}),
        ...(photoUrl !== undefined ? { photoUrl } : {}),
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

    return NextResponse.json(dish);
  } catch (error) {
    console.error('PATCH /api/restaurant-dishes/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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

    const { id } = await context.params;

    const existing = await prisma.restaurantDish.findUnique({
      where: { id },
      select: { id: true, restaurantId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'plat introuvable' }, { status: 404 });
    }

    if (auth.role !== 'ADMIN' && existing.restaurantId !== auth.userId) {
      return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
    }

    await prisma.restaurantDish.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/restaurant-dishes/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
