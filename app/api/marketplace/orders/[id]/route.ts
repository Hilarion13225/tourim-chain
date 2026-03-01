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

    const { id } = await context.params;

    const existing = await prisma.marketplaceOrder.findUnique({
      where: { id },
      select: {
        id: true,
        touristId: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'commande introuvable' },
        { status: 404 },
      );
    }

    if (auth.role !== 'ADMIN' && existing.touristId !== auth.userId) {
      return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
    }

    const body = await request.json();
    const { status, paymentStatus, paymentReference } = body as {
      status?: string;
      paymentStatus?: string;
      paymentReference?: string;
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

    if (!status && !paymentStatus && paymentReference === undefined) {
      return NextResponse.json(
        { error: 'aucune donnée à mettre à jour' },
        { status: 400 },
      );
    }

    const nextStatus =
      status && isValidOrderStatus(status) ? status : undefined;
    const nextPaymentStatus =
      paymentStatus && isValidPaymentStatus(paymentStatus)
        ? paymentStatus
        : undefined;

    const order = await prisma.marketplaceOrder.update({
      where: { id },
      data: {
        ...(nextStatus ? { status: nextStatus } : {}),
        ...(nextPaymentStatus ? { paymentStatus: nextPaymentStatus } : {}),
        ...(paymentReference !== undefined ? { paymentReference } : {}),
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
    });

    if (nextPaymentStatus === 'PAID') {
      await trackEvent({
        userId: existing.touristId,
        eventType: 'marketplace_payment_confirmed',
        module: 'SOUVENIR',
        amount: Number(order.totalAmount),
        success: true,
        metadata: {
          orderId: order.id,
          status: order.status,
        },
      });

      try {
        await registerBlockchainProof({
          ownerId: existing.touristId,
          entityType: 'DIGITAL_SOUVENIR',
          sourceType: 'MARKETPLACE_ORDER',
          sourceId: order.id,
          payload: {
            orderId: order.id,
            touristId: existing.touristId,
            totalAmount: Number(order.totalAmount),
            paymentStatus: order.paymentStatus,
            status: order.status,
            productIds: order.items.map((item) => item.product.id),
          },
          productId: order.items[0]?.product.id,
        });
      } catch (blockchainError) {
        console.error('blockchain:marketplace-order', blockchainError);
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('PATCH /api/marketplace/orders/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
