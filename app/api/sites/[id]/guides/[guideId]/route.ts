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

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; guideId: string }> },
) {
  try {
    const { id: siteId, guideId } = await context.params;

    const links = await prisma.adminAction.findMany({
      where: {
        targetType: 'TOURIST_SITE',
        targetId: siteId,
        action: 'SITE_GUIDE_AFFILIATION',
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, metadata: true },
    });

    const targetLink = links.find(
      (item) => readGuideIdFromMetadata(item.metadata) === guideId,
    );

    if (!targetLink) {
      return NextResponse.json(
        { error: 'affiliation introuvable' },
        { status: 404 },
      );
    }

    await prisma.adminAction.delete({ where: { id: targetLink.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/sites/[id]/guides/[guideId]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
