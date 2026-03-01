import { NextRequest, NextResponse } from 'next/server';
import { PaymentStatus } from '@/app/generated/prisma/enums';
import { trackEvent } from '@/lib/analytics';
import { registerBlockchainProof } from '@/lib/blockchain';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const existing = await prisma.eventOrder.findUnique({
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

    if (auth.role !== 'ADMIN' && auth.userId !== existing.touristId) {
      return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
    }

    const body = await request.json();
    const { status, paymentReference } = body as {
      status?: string;
      paymentReference?: string;
    };

    if (!status || !isValidPaymentStatus(status)) {
      return NextResponse.json({ error: 'status invalide' }, { status: 400 });
    }

    const order = await prisma.eventOrder.update({
      where: { id },
      data: {
        status,
        ...(paymentReference ? { paymentReference } : {}),
      },
      include: {
        event: {
          select: { id: true, nom: true },
        },
      },
    });

    if (status === 'PAID') {
      await trackEvent({
        userId: existing.touristId,
        eventType: 'event_payment_confirmed',
        module: 'SPORT',
        amount: Number(order.totalAmount),
        success: true,
        metadata: {
          orderId: order.id,
          eventId: order.event.id,
        },
      });

      try {
        await registerBlockchainProof({
          ownerId: existing.touristId,
          entityType: 'EVENT_TICKET',
          sourceType: 'EVENT_ORDER',
          sourceId: order.id,
          payload: {
            orderId: order.id,
            eventId: order.event.id,
            eventName: order.event.nom,
            touristId: existing.touristId,
            totalAmount: Number(order.totalAmount),
            paymentStatus: order.status,
          },
        });
      } catch (blockchainError) {
        console.error('blockchain:event-order', blockchainError);
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('PATCH /api/events/orders/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
