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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? undefined;
    const region = searchParams.get('region') ?? undefined;
    const categorie = searchParams.get('categorie') ?? undefined;

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
        ...(categorie && isValidCategory(categorie)
          ? { categorieTourisme: categorie }
          : {}),
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
      latitude,
      longitude,
    } = body as {
      slug?: string;
      nom?: string;
      region?: string;
      description?: string;
      categorieTourisme?: string;
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

    if (!isValidCategory(categorieTourisme)) {
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
        categorieTourisme,
        latitude,
        longitude,
      },
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    console.error('POST /api/sites', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
