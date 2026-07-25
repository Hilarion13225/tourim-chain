import { NextRequest, NextResponse } from 'next/server';
import { OrderStatus, PaymentStatus } from '@/app/generated/prisma/enums';
import { trackEvent } from '@/lib/analytics';
import { registerBlockchainProof } from '@/lib/blockchain';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function isValidOrderStatus(
  value: string,
): value is (typeof OrderStatus)[keyof typeof OrderStatus] {
  return Object.values(OrderStatus).includes(
    value as (typeof OrderStatus)[keyof typeof OrderStatus],
  );
}

function isValidPaymentStatus(
  value: string,
): value is (typeof PaymentStatus)[keyof typeof PaymentStatus] {
  return Object.values(PaymentStatus).includes(
    value as (typeof PaymentStatus)[keyof typeof PaymentStatus],
  );
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

    if (
      auth.role !== 'RESTAURANT' &&
      auth.role !== 'ADMIN' &&
      auth.role !== 'TOURIST'
    ) {
      return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
    }

    const { id } = await context.params;

    const existing = await prisma.restaurantOrder.findUnique({
      where: { id },
      select: { id: true, restaurantId: true, touristId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'commande introuvable' },
        { status: 404 },
      );
    }

    if (auth.role === 'RESTAURANT' && existing.restaurantId !== auth.userId) {
      return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
    }

    if (auth.role === 'TOURIST' && existing.touristId !== auth.userId) {
      return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
    }

    const body = await request.json();
    const { status, paymentStatus } = body as {
      status?: string;
      paymentStatus?: string;
    };

    if (status && !isValidOrderStatus(status)) {
      return NextResponse.json({ error: 'status invalide' }, { status: 400 });
    }

    if (paymentStatus && !isValidPaymentStatus(paymentStatus)) {
      return NextResponse.json(
        { error: 'paymentStatus invalide' },
        { status: 400 },
      );
    }

    if (!status && !paymentStatus) {
      return NextResponse.json(
        { error: 'aucune donnée à mettre à jour' },
        { status: 400 },
      );
    }

    const order = await prisma.restaurantOrder.update({
      where: { id },
      data: {
        ...(status ? { status: status as OrderStatus } : {}),
        ...(paymentStatus ? { paymentStatus: paymentStatus as PaymentStatus } : {}),
      },
      include: {
        dish: {
          select: {
            id: true,
            nom: true,
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
    });

    if (paymentStatus === 'PAID') {
      await trackEvent({
        userId: order.tourist.id,
        eventType: 'restaurant_payment_confirmed',
        module: 'RESTAURATION_PLAT',
        amount: Number(order.totalAmount),
        success: true,
        metadata: {
          orderId: order.id,
          dishId: order.dish.id,
          restaurantId: existing.restaurantId,
        },
      });

      try {
        await registerBlockchainProof({
          ownerId: order.tourist.id,
          entityType: 'EVENT_TICKET',
          sourceType: 'RESTAURATION_ORDER',
          sourceId: order.id,
          payload: {
            orderId: order.id,
            dishId: order.dish.id,
            touristId: order.tourist.id,
            restaurantId: existing.restaurantId,
            totalAmount: Number(order.totalAmount),
            paymentStatus: order.paymentStatus,
            status: order.status,
          },
        });
      } catch (blockchainError) {
        console.error('blockchain:restaurant-order', blockchainError);
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('PATCH /api/restaurant-orders/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}