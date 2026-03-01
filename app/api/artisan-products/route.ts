import { NextRequest, NextResponse } from 'next/server';
import { MediaType } from '@/app/generated/prisma/enums';
import { ProductStatus } from '@/app/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

function isValidProductStatus(
  value: string,
): value is (typeof ProductStatus)[keyof typeof ProductStatus] {
  return Object.values(ProductStatus).includes(
    value as (typeof ProductStatus)[keyof typeof ProductStatus],
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? undefined;
    const artisanId = searchParams.get('artisanId') ?? undefined;
    const status = searchParams.get('status') ?? 'ACTIVE';

    const products = await prisma.artisanProduct.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { nom: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { categorie: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(artisanId ? { artisanId } : {}),
        ...(status && isValidProductStatus(status)
          ? { status }
          : { status: ProductStatus.ACTIVE }),
      },
      include: {
        artisan: {
          select: {
            id: true,
            nom: true,
            email: true,
            verified: true,
          },
        },
        medias: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('GET /api/artisan-products', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      artisanId,
      nom,
      description,
      categorie,
      culture,
      regionOrigine,
      imageUrl,
      prix,
      stock,
      status,
    } = body as {
      artisanId?: string;
      nom?: string;
      description?: string;
      categorie?: string;
      culture?: string;
      regionOrigine?: string;
      imageUrl?: string;
      prix?: number;
      stock?: number;
      status?: string;
    };

    const resolvedCategory = categorie ?? culture;

    if (
      !artisanId ||
      !nom ||
      !description ||
      !resolvedCategory ||
      prix === undefined
    ) {
      return NextResponse.json(
        {
          error:
            'artisanId, nom, description, categorie/culture et prix sont requis',
        },
        { status: 400 },
      );
    }

    if (status && !isValidProductStatus(status)) {
      return NextResponse.json({ error: 'status invalide' }, { status: 400 });
    }

    const normalizedStatus =
      status && isValidProductStatus(status) ? status : undefined;

    const product = await prisma.artisanProduct.create({
      data: {
        artisanId,
        nom,
        description,
        categorie: resolvedCategory,
        regionOrigine,
        prix,
        stock: stock ?? 0,
        ...(imageUrl
          ? {
              medias: {
                create: [
                  {
                    url: imageUrl,
                    type: MediaType.IMAGE,
                  },
                ],
              },
            }
          : {}),
        ...(normalizedStatus ? { status: normalizedStatus } : {}),
      },
      include: {
        artisan: {
          select: {
            id: true,
            nom: true,
            email: true,
            verified: true,
          },
        },
        medias: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('POST /api/artisan-products', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
