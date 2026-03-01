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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? undefined;
    const region = searchParams.get('region') ?? undefined;
    const categorie = searchParams.get('categorie') ?? undefined;
    const includeInactive =
      searchParams.get('includeInactive') === '1' ||
      searchParams.get('includeInactive') === 'true';
    const normalizedCategory = normalizeCategory(categorie);

    const sites = await prisma.touristSite.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { nom: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(region
          ? { region: { contains: region, mode: 'insensitive' } }
          : {}),
        ...(normalizedCategory
          ? { categorieTourisme: normalizedCategory }
          : {}),
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        medias: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(sites);
  } catch (error) {
    console.error('GET /api/sites', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      slug,
      nom,
      region,
      description,
      categorieTourisme,
      photoUrl,
      latitude,
      longitude,
    } = body as {
      slug?: string;
      nom?: string;
      region?: string;
      description?: string;
      categorieTourisme?: string;
      photoUrl?: string;
      latitude?: number;
      longitude?: number;
    };

    if (!slug || !nom || !region || !description || !categorieTourisme) {
      return NextResponse.json(
        {
          error:
            'slug, nom, region, description, categorieTourisme sont requis',
        },
        { status: 400 },
      );
    }

    const normalizedCategory = normalizeCategory(categorieTourisme);

    if (!normalizedCategory) {
      return NextResponse.json(
        { error: 'categorieTourisme invalide' },
        { status: 400 },
      );
    }

    const site = await prisma.touristSite.create({
      data: {
        slug,
        nom,
        region,
        description,
        categorieTourisme: normalizedCategory,
        latitude,
        longitude,
        ...(photoUrl
          ? {
              medias: {
                create: {
                  url: photoUrl,
                  type: 'IMAGE',
                },
              },
            }
          : {}),
      },
      include: {
        medias: true,
      },
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    console.error('POST /api/sites', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
