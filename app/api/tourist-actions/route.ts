import { NextRequest, NextResponse } from 'next/server';
import { OrderStatus, PaymentStatus } from '@/app/generated/prisma/enums';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type TouristActionType =
  | 'TOURISM_ACTIVITY'
  | 'ACCOMMODATION'
  | 'VEHICLE_RENTAL'
  | 'FOOD_RESTAURANT'
  | 'FOOD_DISH'
  | 'SPORT_ACTIVITY'
  | 'SPORT_EVENT'
  | 'SOUVENIR_PURCHASE';

type TouristActionPayload = {
  actionType?: TouristActionType;
  itemId?: string;
  itemLabel?: string;
  amount?: number;
  quantity?: number;
  participants?: number;
  date?: string;
};

function safeNumber(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function makeDemoReference(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

type GuideMeta = {
  guideId?: string;
};

function readGuideIdFromMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const guideId = (metadata as GuideMeta).guideId;
  return typeof guideId === 'string' && guideId ? guideId : null;
}

async function findAutoAssignedGuideId(params?: { siteId?: string }) {
  const siteId = params?.siteId;

  if (siteId) {
    const links = await prisma.adminAction.findMany({
      where: {
        targetType: 'TOURIST_SITE',
        targetId: siteId,
        action: 'SITE_GUIDE_AFFILIATION',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        metadata: true,
      },
    });

    const principalGuideId = links
      .map((item) => readGuideIdFromMetadata(item.metadata))
      .find((value): value is string => Boolean(value));

    if (principalGuideId) {
      const affiliatedGuide = await prisma.user.findFirst({
        where: {
          id: principalGuideId,
          role: 'GUIDE',
          status: 'ACTIVE',
          verified: true,
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });

      if (affiliatedGuide) {
        return affiliatedGuide.id;
      }

      const affiliatedFallbackGuide = await prisma.user.findFirst({
        where: {
          id: principalGuideId,
          role: 'GUIDE',
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });

      if (affiliatedFallbackGuide) {
        return affiliatedFallbackGuide.id;
      }
    }
  }

  let siteRegion: string | null = null;

  if (siteId) {
    const site = await prisma.touristSite.findUnique({
      where: { id: siteId },
      select: { region: true },
    });

    siteRegion = site?.region ?? null;
  }

  if (siteRegion) {
    const regionGuide = await prisma.user.findFirst({
      where: {
        role: 'GUIDE',
        status: 'ACTIVE',
        verified: true,
        guideProfile: {
          is: {
            region: { contains: siteRegion, mode: 'insensitive' },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (regionGuide) {
      return regionGuide.id;
    }
  }

  const activeGuide = await prisma.user.findFirst({
    where: {
      role: 'GUIDE',
      status: 'ACTIVE',
      verified: true,
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (activeGuide) {
    return activeGuide.id;
  }

  const fallbackGuide = await prisma.user.findFirst({
    where: { role: 'GUIDE' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  return fallbackGuide?.id ?? null;
}

async function createBookingLikeAction(params: {
  userId: string;
  actionType: TouristActionType;
  itemId: string;
  itemLabel: string;
  amount: number;
  participants: number;
  date?: string;
}) {
  const guideId = await findAutoAssignedGuideId(
    params.actionType === 'TOURISM_ACTIVITY'
      ? { siteId: params.itemId }
      : undefined,
  );

  if (!guideId) {
    return {
      persisted: false,
      reference: makeDemoReference('DEMO'),
      message: 'Action validée en mode démo (aucun guide actif en base).',
    };
  }

  const booking = await prisma.booking.create({
    data: {
      touristId: params.userId,
      guideId,
      date: params.date
        ? new Date(params.date)
        : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      participants: params.participants,
      totalAmount: params.amount,
      notes: `[${params.actionType}] ${params.itemLabel} (${params.itemId})`,
    },
    select: {
      id: true,
      totalAmount: true,
      date: true,
    },
  });

  return {
    persisted: true,
    reference: booking.id,
    bookingId: booking.id,
    message: 'Action enregistrée avec succès.',
  };
}

async function createSouvenirOrder(params: {
  userId: string;
  itemId: string;
  itemLabel: string;
  quantity: number;
  amount: number;
}) {
  const product = await prisma.artisanProduct.findUnique({
    where: { id: params.itemId },
    select: {
      id: true,
      nom: true,
      prix: true,
      stock: true,
    },
  });

  if (!product) {
    return {
      persisted: false,
      reference: makeDemoReference('SOUVENIR'),
      totalAmount: params.amount * params.quantity,
      message: 'Achat validé en mode catalogue touristique (démo).',
    };
  }

  if (product.stock < params.quantity) {
    return {
      error: 'Stock insuffisant pour ce souvenir.',
    };
  }

  const unitPrice = Number(product.prix?.toString?.() ?? product.prix ?? 0);
  const totalAmount = unitPrice * params.quantity;

  const order = await prisma.$transaction(async (trx) => {
    const createdOrder = await trx.marketplaceOrder.create({
      data: {
        touristId: params.userId,
        totalAmount,
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        items: {
          create: {
            productId: product.id,
            quantity: params.quantity,
            unitPrice,
          },
        },
      },
      select: { id: true },
    });

    await trx.artisanProduct.update({
      where: { id: product.id },
      data: { stock: { decrement: params.quantity } },
    });

    return createdOrder;
  });

  return {
    persisted: true,
    reference: order.id,
    orderId: order.id,
    totalAmount,
    message: 'Achat souvenir enregistré avec succès.',
  };
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

    const body = (await request.json()) as TouristActionPayload;

    if (!body.actionType || !body.itemId) {
      return NextResponse.json(
        { error: 'actionType et itemId sont requis' },
        { status: 400 },
      );
    }

    const itemLabel = body.itemLabel?.trim() || body.itemId;
    const amount = safeNumber(body.amount, 1000);
    const participants = safeNumber(body.participants, 1);

    if (body.actionType === 'SOUVENIR_PURCHASE') {
      const quantity = safeNumber(body.quantity, 1);
      const purchaseResult = await createSouvenirOrder({
        userId: auth.userId,
        itemId: body.itemId,
        itemLabel,
        quantity,
        amount,
      });

      if ('error' in purchaseResult) {
        return NextResponse.json(
          { error: purchaseResult.error },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          actionType: body.actionType,
          ...purchaseResult,
        },
        { status: 201 },
      );
    }

    const bookingLikeResult = await createBookingLikeAction({
      userId: auth.userId,
      actionType: body.actionType,
      itemId: body.itemId,
      itemLabel,
      amount,
      participants,
      date: body.date,
    });

    return NextResponse.json(
      {
        success: true,
        actionType: body.actionType,
        ...bookingLikeResult,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/tourist-actions', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
