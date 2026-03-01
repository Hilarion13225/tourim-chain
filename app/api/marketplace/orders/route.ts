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

    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'token invalide' }, { status: 401 });
    }

    const whereClause =
      payload.role === 'ADMIN' ? {} : { touristId: payload.userId };

    const orders = await prisma.marketplaceOrder.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                nom: true,
                artisan: {
                  select: {
                    id: true,
                    nom: true,
                  },
                },
                medias: {
                  orderBy: { createdAt: 'asc' },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    });

    const serialized = orders.map((order) => {
      const firstItem = order.items[0] ?? null;
      const quantity = firstItem?.quantity ?? 1;
      const unitPrice = firstItem ? Number(firstItem.unitPrice) : 0;

      return {
        id: order.id,
        totalAmount: Number(order.totalAmount),
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        paymentReference: order.paymentReference,
        product: firstItem
          ? {
              id: firstItem.product.id,
              nom: firstItem.product.nom,
              photoUrl: firstItem.product.medias[0]?.url ?? null,
            }
          : null,
        artisan: firstItem
          ? {
              id: firstItem.product.artisan.id,
              nom: firstItem.product.artisan.nom,
            }
          : null,
        quantity,
        unitPrice,
      };
    });

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('GET /api/marketplace/orders', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'non authentifié' }, { status: 401 });
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'token invalide' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity, autoPaid, shippingAddress, paymentReference } =
      body as {
        productId?: string;
        quantity?: number;
        autoPaid?: boolean;
        shippingAddress?: string;
        paymentReference?: string;
      };

    if (!productId) {
      return NextResponse.json({ error: 'productId requis' }, { status: 400 });
    }

    const safeQuantity = quantity && quantity > 0 ? quantity : 1;

    const product = await prisma.artisanProduct.findUnique({
      where: { id: productId },
      select: {
        id: true,
        nom: true,
        prix: true,
        stock: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'produit introuvable' },
        { status: 404 },
      );
    }

    if (product.stock < safeQuantity) {
      return NextResponse.json({ error: 'stock insuffisant' }, { status: 400 });
    }

    const unitPrice = toNumber(product.prix);
    const totalAmount = unitPrice * safeQuantity;

    const order = await prisma.$transaction(async (trx) => {
      const createdOrder = await trx.marketplaceOrder.create({
        data: {
          touristId: payload.userId,
          totalAmount,
          status: autoPaid === false ? OrderStatus.PENDING : OrderStatus.PAID,
          paymentStatus:
            autoPaid === false ? PaymentStatus.UNPAID : PaymentStatus.PAID,
          ...(shippingAddress ? { shippingAddress } : {}),
          ...(paymentReference ? { paymentReference } : {}),
          items: {
            create: {
              productId,
              quantity: safeQuantity,
              unitPrice,
            },
          },
        },
      });

      await trx.artisanProduct.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: safeQuantity,
          },
        },
      });

      return createdOrder;
    });

    await trackEvent({
      userId: payload.userId,
      eventType: 'marketplace_order_created',
      module: 'SOUVENIR',
      amount: totalAmount,
      success: true,
      metadata: {
        orderId: order.id,
        productId,
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
    console.error('POST /api/marketplace/orders', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
