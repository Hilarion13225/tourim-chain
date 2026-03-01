import { NextRequest, NextResponse } from 'next/server';
import { OrderStatus, PaymentStatus } from '@/app/generated/prisma/enums';
import { trackEvent } from '@/lib/analytics';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toNumber(value: unknown) {
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return Number((value as { toString: () => string }).toString());
  }

  return Number(value ?? 0);
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;

    if (auth.role === 'RESTAURANT') {
      const orders = await prisma.restaurantOrder.findMany({
        where: {
          restaurantId: auth.userId,
          ...(status ? { status: status as OrderStatus } : {}),
        },
        include: {
          dish: {
            select: {
              id: true,
              nom: true,
              photoUrl: true,
            },
          },
          tourist: {
            select: {
              id: true,
              nom: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(orders);
    }

    if (auth.role === 'TOURIST') {
      const orders = await prisma.restaurantOrder.findMany({
        where: {
          touristId: auth.userId,
          ...(status ? { status: status as OrderStatus } : {}),
        },
        include: {
          dish: {
            select: {
              id: true,
              nom: true,
              photoUrl: true,
            },
          },
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

      return NextResponse.json(orders);
    }

    if (auth.role === 'ADMIN') {
      const orders = await prisma.restaurantOrder.findMany({
        include: {
          dish: {
            select: {
              id: true,
              nom: true,
              photoUrl: true,
            },
          },
          tourist: {
            select: {
              id: true,
              nom: true,
              email: true,
            },
          },
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

      return NextResponse.json(orders);
    }

    return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
  } catch (error) {
    console.error('GET /api/restaurant-orders', error);
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

    if (auth.role !== 'TOURIST' && auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
    }

    const body = await request.json();
    const { dishId, quantity } = body as { dishId?: string; quantity?: number };

    if (!dishId) {
      return NextResponse.json({ error: 'dishId requis' }, { status: 400 });
    }

    const safeQuantity = quantity && quantity > 0 ? Math.floor(quantity) : 1;

    const dish = await prisma.restaurantDish.findUnique({
      where: { id: dishId },
      select: {
        id: true,
        nom: true,
        prix: true,
        stock: true,
        disponible: true,
        restaurantId: true,
      },
    });

    if (!dish || !dish.disponible) {
      return NextResponse.json({ error: 'plat indisponible' }, { status: 404 });
    }

    if (dish.stock < safeQuantity) {
      return NextResponse.json({ error: 'stock insuffisant' }, { status: 400 });
    }

    const unitPrice = toNumber(dish.prix);
    const totalAmount = unitPrice * safeQuantity;

    const order = await prisma.$transaction(async (trx) => {
      const createdOrder = await trx.restaurantOrder.create({
        data: {
          restaurantId: dish.restaurantId,
          touristId: auth.userId,
          dishId: dish.id,
          quantity: safeQuantity,
          unitPrice,
          totalAmount,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
        },
      });

      await trx.restaurantDish.update({
        where: { id: dish.id },
        data: {
          stock: {
            decrement: safeQuantity,
          },
          ...(dish.stock - safeQuantity <= 0 ? { disponible: false } : {}),
        },
      });

      return createdOrder;
    });

    await trackEvent({
      userId: auth.userId,
      eventType: 'restaurant_order_created',
      module: 'RESTAURATION_PLAT',
      amount: totalAmount,
      success: true,
      metadata: {
        orderId: order.id,
        dishId: dish.id,
        restaurantId: dish.restaurantId,
        quantity: safeQuantity,
      },
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        totalAmount,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/restaurant-orders', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
