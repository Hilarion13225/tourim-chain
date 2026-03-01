import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function buildExplorerTxUrl(txHash: string, network: 'OFFCHAIN' | 'EVM') {
  if (network === 'OFFCHAIN') {
    return null;
  }

  const explorerBase = process.env.BLOCKCHAIN_EXPLORER_BASE_URL ?? '';
  if (!explorerBase) {
    return null;
  }

  return `${explorerBase.replace(/\/$/, '')}/tx/${txHash}`;
}

function parseSource(metadataUrl: string | null) {
  if (!metadataUrl || !metadataUrl.startsWith('source://')) {
    return { sourceType: 'UNKNOWN', sourceId: '-' };
  }

  const parsed = metadataUrl.replace('source://', '');
  const separatorIndex = parsed.indexOf('/');

  if (separatorIndex < 0) {
    return { sourceType: parsed || 'UNKNOWN', sourceId: '-' };
  }

  return {
    sourceType: parsed.slice(0, separatorIndex) || 'UNKNOWN',
    sourceId: parsed.slice(separatorIndex + 1) || '-',
  };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'non authentifié' }, { status: 401 });
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'token invalide' }, { status: 401 });
    }

    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get('limit') ?? '20');
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 100)
      : 20;

    const [totalAssets, recentAssets, byEntityTypeRaw] = await Promise.all([
      prisma.blockchainAsset.count(),
      prisma.blockchainAsset.findMany({
        take: limit,
        orderBy: { mintedAt: 'desc' },
        select: {
          id: true,
          ownerId: true,
          entityType: true,
          wallet: true,
          hashTransaction: true,
          metadataUrl: true,
          mintedAt: true,
        },
      }),
      prisma.blockchainAsset.groupBy({
        by: ['entityType'],
        _count: { _all: true },
      }),
    ]);

    const byEntityType = byEntityTypeRaw.map((entry) => ({
      entityType: entry.entityType,
      count: entry._count._all,
    }));

    const assets = recentAssets.map((asset) => {
      const source = parseSource(asset.metadataUrl);
      const network = asset.wallet === 'OFFCHAIN' ? 'OFFCHAIN' : 'EVM';
      return {
        ...asset,
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        network,
        explorerUrl: buildExplorerTxUrl(asset.hashTransaction, network),
      };
    });

    return NextResponse.json({
      summary: {
        totalAssets,
        byEntityType,
      },
      assets,
    });
  } catch (error) {
    console.error('GET /api/admin/blockchain-assets', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
