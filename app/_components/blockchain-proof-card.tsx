'use client';

import { useEffect, useState } from 'react';

type BlockchainProofResponse = {
  proof: {
    txHash: string;
    entityType: string;
    wallet: string;
    mintedAt: string;
    explorerUrl: string | null;
  };
  verification: {
    status: 'CONFIRMED' | 'PENDING' | 'UNKNOWN';
    network: string;
    explorerUrl: string | null;
  };
};

type Props = {
  sourceType: string;
  sourceId: string;
};

function truncate(value: string) {
  if (value.length <= 20) {
    return value;
  }
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

function statusLabel(
  status: BlockchainProofResponse['verification']['status'],
) {
  switch (status) {
    case 'CONFIRMED':
      return 'Confirmée';
    case 'PENDING':
      return 'En attente';
    case 'UNKNOWN':
      return 'Inconnue';
  }
}

export default function BlockchainProofCard({ sourceType, sourceId }: Props) {
  const [data, setData] = useState<BlockchainProofResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `/api/blockchain/verify?sourceType=${encodeURIComponent(sourceType)}&sourceId=${encodeURIComponent(sourceId)}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const payload = (await response.json()) as
          | BlockchainProofResponse
          | { error?: string };

        if (!response.ok) {
          setError(
            (payload as { error?: string }).error ?? 'Preuve indisponible',
          );
          return;
        }

        setData(payload as BlockchainProofResponse);
      })
      .catch((reason: unknown) => {
        if (
          reason &&
          typeof reason === 'object' &&
          'name' in reason &&
          (reason as { name: string }).name === 'AbortError'
        ) {
          return;
        }
        setError('Preuve indisponible');
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [sourceId, sourceType]);

  const mintedLabel = (() => {
    if (!data?.proof.mintedAt) {
      return '—';
    }
    const date = new Date(data.proof.mintedAt);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  })();

  return (
    <article className="rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm dark:border-white/15 dark:bg-zinc-900/40">
      <p className="font-semibold text-zinc-900 dark:text-white">
        Preuve blockchain
      </p>

      {isLoading ? (
        <p className="mt-2 text-zinc-500">Vérification en cours...</p>
      ) : error || !data ? (
        <p className="mt-2 text-zinc-500">
          Aucune preuve on-chain trouvée pour ce reçu.
        </p>
      ) : (
        <div className="mt-2 space-y-1 text-zinc-700 dark:text-zinc-300">
          <p>
            Statut: <strong>{statusLabel(data.verification.status)}</strong>
          </p>
          <p>
            Réseau: <strong>{data.verification.network}</strong>
          </p>
          <p>
            Tx:{' '}
            <strong title={data.proof.txHash}>
              {truncate(data.proof.txHash)}
            </strong>
          </p>
          <p>
            Minted: <strong>{mintedLabel}</strong>
          </p>

          {data.proof.explorerUrl ? (
            <a
              href={data.proof.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-lg border border-zinc-300 px-3 py-1.5 font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-white/20 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Vérifier sur la blockchain
            </a>
          ) : null}
        </div>
      )}
    </article>
  );
}
