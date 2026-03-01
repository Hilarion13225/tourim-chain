import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: siteId } = await context.params;

    const links = await prisma.adminAction.findMany({
      where: {
        targetType: 'TOURIST_SITE',
        targetId: siteId,
        action: 'SITE_GUIDE_AFFILIATION',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        metadata: true,
        createdAt: true,
      },
    });

    const latestGuideId = links
      .map((item) => readGuideIdFromMetadata(item.metadata))
      .find((value): value is string => Boolean(value));

    if (!latestGuideId) {
      return NextResponse.json([]);
    }

    const guides = await prisma.user.findMany({
      where: {
        id: latestGuideId,
        role: 'GUIDE',
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        nom: true,
        email: true,
        status: true,
        verified: true,
      },
    });

    return NextResponse.json(guides);
  } catch (error) {
    console.error('GET /api/sites/[id]/guides', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: siteId } = await context.params;
    const body = await request.json();
    const { guideId } = body as { guideId?: string };

    if (!guideId) {
      return NextResponse.json({ error: 'guideId requis' }, { status: 400 });
    }

    const guide = await prisma.user.findFirst({
      where: { id: guideId, role: 'GUIDE' },
      select: { id: true },
    });

    if (!guide) {
      return NextResponse.json({ error: 'guide introuvable' }, { status: 404 });
    }

    const existingLinks = await prisma.adminAction.findMany({
      where: {
        targetType: 'TOURIST_SITE',
        targetId: siteId,
        action: 'SITE_GUIDE_AFFILIATION',
      },
      select: {
        id: true,
        metadata: true,
      },
    });

    const alreadyPrincipal = existingLinks.some(
      (item) => readGuideIdFromMetadata(item.metadata) === guideId,
    );

    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    const actorId = adminUser?.id ?? guideId;

    if (alreadyPrincipal) {
      return NextResponse.json({ success: true, unchanged: true });
    }

    if (existingLinks.length > 0) {
      await prisma.adminAction.deleteMany({
        where: {
          id: {
            in: existingLinks.map((item) => item.id),
          },
        },
      });
    }

    await prisma.adminAction.create({
      data: {
        adminId: actorId,
        action: 'SITE_GUIDE_AFFILIATION',
        targetType: 'TOURIST_SITE',
        targetId: siteId,
        metadata: { guideId },
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/sites/[id]/guides', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
