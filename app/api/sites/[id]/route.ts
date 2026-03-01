import { NextRequest, NextResponse } from 'next/server';
import { TourismCategory } from '@/app/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

const categoryAliases: Record<string, TourismCategory> = {
  CULTURE: TourismCategory.CULTURE,
  CULTUREL: TourismCategory.CULTURE,
  BEACH: TourismCategory.BEACH,
  BALNEAIRE: TourismCategory.BEACH,
  NATURE: TourismCategory.NATURE,
  ECOTOURISME: TourismCategory.NATURE,
  ADVENTURE: TourismCategory.ADVENTURE,
  URBAN: TourismCategory.ADVENTURE,
  URBAIN: TourismCategory.ADVENTURE,
  URBAIN_EVENT: TourismCategory.ADVENTURE,
  HERITAGE: TourismCategory.HERITAGE,
  RELIGIOUS: TourismCategory.RELIGIOUS,
  OTHER: TourismCategory.OTHER,
};

function isValidCategory(
  value: string,
): value is (typeof TourismCategory)[keyof typeof TourismCategory] {
  return Object.values(TourismCategory).includes(
    value as (typeof TourismCategory)[keyof typeof TourismCategory],
  );
}

function normalizeCategory(value?: string) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (normalized in categoryAliases) {
    return categoryAliases[normalized];
  }

  if (isValidCategory(normalized)) {
    return normalized;
  }

  return null;
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
      photoUrl,
      isActive,
      latitude,
      longitude,
    } = body as {
      nom?: string;
      region?: string;
      description?: string;
      categorieTourisme?: string;
      photoUrl?: string;
      isActive?: boolean;
      latitude?: number | null;
      longitude?: number | null;
    };

    const normalizedCategory = categorieTourisme
      ? normalizeCategory(categorieTourisme)
      : undefined;

    if (categorieTourisme && !normalizedCategory) {
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
        ...(normalizedCategory
          ? { categorieTourisme: normalizedCategory }
          : {}),
        isActive,
        latitude,
        longitude,
      },
    });

    if (photoUrl !== undefined) {
      const existingImage = await prisma.siteMedia.findFirst({
        where: { siteId: id, type: 'IMAGE' },
        orderBy: { createdAt: 'asc' },
      });

      if (existingImage) {
        await prisma.siteMedia.update({
          where: { id: existingImage.id },
          data: { url: photoUrl },
        });
      } else {
        await prisma.siteMedia.create({
          data: {
            siteId: id,
            url: photoUrl,
            type: 'IMAGE',
          },
        });
      }
    }

    const reloadedSite = await prisma.touristSite.findUnique({
      where: { id: updatedSite.id },
      include: { medias: true, reviews: true },
    });

    return NextResponse.json(reloadedSite ?? updatedSite);
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
