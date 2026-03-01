import { createHash } from 'crypto';
import { JsonRpcProvider, Wallet } from 'ethers';
import { BlockchainEntityType } from '@/app/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

type AnchorPayload = Record<string, unknown>;

type RegisterBlockchainProofInput = {
  ownerId: string;
  entityType: (typeof BlockchainEntityType)[keyof typeof BlockchainEntityType];
  sourceType: string;
  sourceId: string;
  payload: AnchorPayload;
  productId?: string;
  eventTicketId?: string;
  forceNewAnchor?: boolean;
};

type TransactionVerificationStatus = 'CONFIRMED' | 'PENDING' | 'UNKNOWN';

type TransactionVerification = {
  status: TransactionVerificationStatus;
  network: string;
  explorerUrl: string | null;
};

function getExplorerBaseUrl() {
  return process.env.BLOCKCHAIN_EXPLORER_BASE_URL ?? null;
}

function getRpcUrl() {
  return process.env.BLOCKCHAIN_RPC_URL ?? '';
}

function getPrivateKey() {
  return process.env.BLOCKCHAIN_PRIVATE_KEY ?? '';
}

function sourceLocator(sourceType: string, sourceId: string) {
  return `source://${sourceType}/${sourceId}`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => a.localeCompare(b),
    );
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function computePayloadHash(payload: AnchorPayload) {
  return createHash('sha256').update(stableStringify(payload)).digest('hex');
}

function buildExplorerTxUrl(txHash: string) {
  const base = getExplorerBaseUrl();
  if (!base) {
    return null;
  }
  return `${base.replace(/\/$/, '')}/tx/${txHash}`;
}

async function anchorHashOnEvm(payloadHash: string) {
  const rpcUrl = getRpcUrl();
  const privateKey = getPrivateKey();

  if (!rpcUrl || !privateKey) {
    const syntheticHash = `offchain_${payloadHash.slice(0, 40)}_${Date.now().toString(36)}`;
    return {
      txHash: syntheticHash,
      wallet: 'OFFCHAIN',
      network: 'OFFCHAIN',
      explorerUrl: null,
    };
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  const networkInfo = await provider.getNetwork();

  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: BigInt(0),
    data: `0x${payloadHash}`,
  });

  return {
    txHash: tx.hash,
    wallet: wallet.address,
    network: `EVM:${networkInfo.chainId.toString()}`,
    explorerUrl: buildExplorerTxUrl(tx.hash),
  };
}

export async function registerBlockchainProof(input: RegisterBlockchainProofInput) {
  const locator = sourceLocator(input.sourceType, input.sourceId);
  const shouldForceNewAnchor = input.forceNewAnchor === true;

  const existing = await prisma.blockchainAsset.findFirst({
    where: {
      ownerId: input.ownerId,
      metadataUrl: locator,
    },
    orderBy: { mintedAt: 'desc' },
  });

  if (existing && !shouldForceNewAnchor) {
    return {
      asset: existing,
      isNew: false,
      explorerUrl: buildExplorerTxUrl(existing.hashTransaction),
      network: existing.wallet === 'OFFCHAIN' ? 'OFFCHAIN' : 'EVM',
    };
  }

  const payloadHash = computePayloadHash({
    ...input.payload,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
  });

  const anchored = await anchorHashOnEvm(payloadHash);

  const created = await prisma.blockchainAsset.create({
    data: {
      ownerId: input.ownerId,
      entityType: input.entityType,
      ...(input.productId ? { productId: input.productId } : {}),
      ...(input.eventTicketId ? { eventTicketId: input.eventTicketId } : {}),
      wallet: anchored.wallet,
      hashTransaction: anchored.txHash,
      metadataUrl: locator,
    },
  });

  return {
    asset: created,
    isNew: true,
    explorerUrl: anchored.explorerUrl,
    network: anchored.network,
  };
}

export async function getBlockchainProofBySource(
  sourceType: string,
  sourceId: string,
) {
  const locator = sourceLocator(sourceType, sourceId);

  const asset = await prisma.blockchainAsset.findFirst({
    where: {
      metadataUrl: locator,
    },
    orderBy: { mintedAt: 'desc' },
  });

  if (!asset) {
    return null;
  }

  return {
    asset,
    explorerUrl: buildExplorerTxUrl(asset.hashTransaction),
  };
}

export async function verifyBlockchainTransaction(
  txHash: string,
): Promise<TransactionVerification> {
  if (!txHash || txHash.startsWith('offchain_')) {
    return {
      status: 'CONFIRMED',
      network: 'OFFCHAIN',
      explorerUrl: null,
    };
  }

  const rpcUrl = getRpcUrl();
  if (!rpcUrl) {
    return {
      status: 'UNKNOWN',
      network: 'EVM',
      explorerUrl: buildExplorerTxUrl(txHash),
    };
  }

  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const receipt = await provider.getTransactionReceipt(txHash);
    const networkInfo = await provider.getNetwork();

    if (!receipt) {
      return {
        status: 'PENDING',
        network: `EVM:${networkInfo.chainId.toString()}`,
        explorerUrl: buildExplorerTxUrl(txHash),
      };
    }

    return {
      status: receipt.status === 1 ? 'CONFIRMED' : 'UNKNOWN',
      network: `EVM:${networkInfo.chainId.toString()}`,
      explorerUrl: buildExplorerTxUrl(txHash),
    };
  } catch {
    return {
      status: 'UNKNOWN',
      network: 'EVM',
      explorerUrl: buildExplorerTxUrl(txHash),
    };
  }
}
