import { NextRequest, NextResponse } from 'next/server';
import { ProductStatus } from '@/app/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

function isValidProductStatus(
  value: string,
): value is (typeof ProductStatus)[keyof typeof ProductStatus] {
  return Object.values(ProductStatus).includes(
    value as (typeof ProductStatus)[keyof typeof ProductStatus],
  );
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const product = await prisma.artisanProduct.findUnique({
      where: { id },
      include: {
        artisan: {
          select: {
            id: true,
            nom: true,
            email: true,
          },
        },
        medias: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'produit introuvable' },
        { status: 404 },
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('GET /api/artisan-products/[id]', error);
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
      description,
      categorie,
      culture,
      regionOrigine,
      imageUrl,
      prix,
      stock,
      status,
    } = body as {
      nom?: string;
      description?: string;
      categorie?: string;
      culture?: string;
      regionOrigine?: string | null;
      imageUrl?: string;
      prix?: number;
      stock?: number;
      status?: string;
    };

    const resolvedCategory = categorie ?? culture;

    if (status && !isValidProductStatus(status)) {
      return NextResponse.json({ error: 'status invalide' }, { status: 400 });
    }

    const normalizedStatus =
      status && isValidProductStatus(status) ? status : undefined;

    const product = await prisma.artisanProduct.update({
      where: { id },
      data: {
        ...(nom ? { nom } : {}),
        ...(description ? { description } : {}),
        ...(resolvedCategory ? { categorie: resolvedCategory } : {}),
        ...(regionOrigine !== undefined ? { regionOrigine } : {}),
        ...(prix !== undefined ? { prix } : {}),
        ...(stock !== undefined ? { stock } : {}),
        ...(normalizedStatus ? { status: normalizedStatus } : {}),
      },
    });

    if (imageUrl !== undefined) {
      const existingImage = await prisma.productMedia.findFirst({
        where: { productId: id, type: 'IMAGE' },
        select: { id: true },
      });

      if (existingImage) {
        await prisma.productMedia.update({
          where: { id: existingImage.id },
          data: { url: imageUrl },
        });
      } else {
        await prisma.productMedia.create({
          data: {
            productId: id,
            url: imageUrl,
            type: 'IMAGE',
          },
        });
      }
    }
    const updated = await prisma.artisanProduct.findUnique({
      where: { id: product.id },
      include: {
        artisan: {
          select: {
            id: true,
            nom: true,
            email: true,
          },
        },
        medias: true,
      },
    });

    return NextResponse.json(updated ?? product);
  } catch (error) {
    console.error('PATCH /api/artisan-products/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await prisma.artisanProduct.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/artisan-products/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
