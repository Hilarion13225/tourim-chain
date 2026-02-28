import { NextRequest, NextResponse } from 'next/server';
import { TourismCategory } from '@/app/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

function isValidCategory(
  value: string,
): value is (typeof TourismCategory)[keyof typeof TourismCategory] {
  return Object.values(TourismCategory).includes(
    value as (typeof TourismCategory)[keyof typeof TourismCategory],
  );
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const site = await prisma.touristSite.findUnique({
      where: { id },
      include: { medias: true, reviews: true },
    });

    if (!site) {
      return NextResponse.json({ error: 'site introuvable' }, { status: 404 });
    }

    return NextResponse.json(site);
  } catch (error) {
    console.error('GET /api/sites/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const {
      nom,
      region,
      description,
      categorieTourisme,
      isActive,
      latitude,
      longitude,
    } = body as {
      nom?: string;
      region?: string;
      description?: string;
      categorieTourisme?: string;
      isActive?: boolean;
      latitude?: number | null;
      longitude?: number | null;
    };

    if (categorieTourisme && !isValidCategory(categorieTourisme)) {
      return NextResponse.json(
        { error: 'categorieTourisme invalide' },
        { status: 400 },
      );
    }

    const updatedSite = await prisma.touristSite.update({
      where: { id },
      data: {
        nom,
        region,
        description,
        categorieTourisme,
        isActive,
        latitude,
        longitude,
      },
    });

    return NextResponse.json(updatedSite);
  } catch (error) {
    console.error('PATCH /api/sites/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    await prisma.touristSite.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/sites/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
