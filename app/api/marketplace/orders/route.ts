import { NextRequest, NextResponse } from 'next/server';
import { OrderStatus, PaymentStatus } from '@/app/generated/prisma/enums';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toNumber(value: unknown) {
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return Number((value as { toString: () => string }).toString());
  }

  return Number(value ?? 0);
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
    const { productId, quantity } = body as {
      productId?: string;
      quantity?: number;
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
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.PAID,
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
