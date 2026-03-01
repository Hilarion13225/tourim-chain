import { NextRequest, NextResponse } from 'next/server';
import {
  getBlockchainProofBySource,
  verifyBlockchainTransaction,
} from '@/lib/blockchain';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get('sourceType')?.trim() ?? '';
    const sourceId = searchParams.get('sourceId')?.trim() ?? '';
    const txHash = searchParams.get('txHash')?.trim() ?? '';

    let asset: Awaited<
      ReturnType<typeof prisma.blockchainAsset.findFirst>
    > | null = null;
    let explorerUrl: string | null = null;

    if (sourceType && sourceId) {
      const bySource = await getBlockchainProofBySource(sourceType, sourceId);
      if (!bySource) {
        return NextResponse.json(
          { error: 'preuve blockchain introuvable' },
          { status: 404 },
        );
      }
      asset = bySource.asset;
      explorerUrl = bySource.explorerUrl;
    } else if (txHash) {
      asset = await prisma.blockchainAsset.findUnique({ where: { hashTransaction: txHash } });
      if (!asset) {
        return NextResponse.json(
          { error: 'transaction blockchain introuvable' },
          { status: 404 },
        );
      }
      explorerUrl = null;
    } else {
      return NextResponse.json(
        { error: 'sourceType/sourceId ou txHash requis' },
        { status: 400 },
      );
    }

    const verification = await verifyBlockchainTransaction(asset.hashTransaction);

    return NextResponse.json({
      source: {
        type: sourceType || null,
        id: sourceId || null,
      },
      proof: {
        assetId: asset.id,
        entityType: asset.entityType,
        txHash: asset.hashTransaction,
        wallet: asset.wallet,
        mintedAt: asset.mintedAt,
        metadataUrl: asset.metadataUrl,
        explorerUrl: verification.explorerUrl ?? explorerUrl,
      },
      verification,
    });
  } catch (error) {
    console.error('GET /api/blockchain/verify', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
