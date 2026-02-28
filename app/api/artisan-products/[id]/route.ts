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
    const { nom, description, categorie, regionOrigine, prix, stock, status } =
      body as {
        nom?: string;
        description?: string;
        categorie?: string;
        regionOrigine?: string | null;
        prix?: number;
        stock?: number;
        status?: string;
      };

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
        ...(categorie ? { categorie } : {}),
        ...(regionOrigine !== undefined ? { regionOrigine } : {}),
        ...(prix !== undefined ? { prix } : {}),
        ...(stock !== undefined ? { stock } : {}),
        ...(normalizedStatus ? { status: normalizedStatus } : {}),
      },
    });

    return NextResponse.json(product);
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
