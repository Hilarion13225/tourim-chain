'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockProducts } from '@/lib/mock-tourism-data';

const USE_MOCK_DATA = true;

type Product = {
  id: string;
  nom: string;
  prix: string;
  status: string;
  certificatBlockchain: string | null;
  artisan: {
    nom: string;
  };
};

function formatMoney(value: string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat('fr-FR').format(amount);
}

export default function ArtisansPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch('/api/auth/me');

        if (!response.ok) {
          setSessionUserId(null);
          return;
        }

        const data = (await response.json()) as { user?: { id?: string } };
        setSessionUserId(data.user?.id ?? null);
      } catch {
        setSessionUserId(null);
      }
    }

    async function loadProducts() {
      setIsLoading(true);
      setError('');

      if (USE_MOCK_DATA) {
        setProducts(mockProducts);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/artisan-products');
        const data = (await response.json()) as Product[] | { error?: string };

        if (!response.ok) {
          setError(
            (data as { error?: string }).error ?? 'Erreur de chargement',
          );
          setProducts([]);
          return;
        }

        setProducts(data as Product[]);
      } catch {
        setError('Erreur réseau, veuillez réessayer.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadSession();
    void loadProducts();
  }, []);

  async function handleOrder(productId: string) {
    setActionError('');
    setActionSuccess('');

    if (!sessionUserId) {
      router.push('/login');
      return;
    }

    setLoadingProductId(productId);

    if (USE_MOCK_DATA) {
      setActionSuccess(`Commande validée (mode démo) pour ${productId}.`);
      setLoadingProductId(null);
      return;
    }

    try {
      const response = await fetch('/api/marketplace/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      const data = (await response.json()) as {
        error?: string;
        totalAmount?: number;
      };

      if (!response.ok) {
        setActionError(data.error ?? 'Commande impossible');
        return;
      }

      setActionSuccess(
        `Commande validée (${new Intl.NumberFormat('fr-FR').format(data.totalAmount ?? 0)} FCFA).`,
      );
    } catch {
      setActionError('Erreur réseau pendant la commande.');
    } finally {
      setLoadingProductId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Artisans de Côte d’Ivoire</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Marketplace de produits culturels ivoiriens authentiques avec
          certificats blockchain.
        </p>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {actionError ? (
        <p className="text-sm text-red-600">{actionError}</p>
      ) : null}
      {actionSuccess ? (
        <p className="text-sm text-emerald-600">{actionSuccess}</p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-zinc-500">Chargement des produits...</p>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="space-y-3 rounded-2xl border border-black/10 p-4 dark:border-white/15"
            >
              <div className="h-32 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
              <h2 className="font-semibold">{product.nom}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {product.artisan.nom}
              </p>
              <p className="text-sm font-medium">
                {formatMoney(product.prix)} FCFA
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="rounded-full border border-black/10 px-2 py-1 dark:border-white/15">
                  {product.certificatBlockchain ? 'Certifié' : product.status}
                </span>
                <button
                  onClick={() => void handleOrder(product.id)}
                  className="rounded-full bg-foreground px-3 py-1.5 text-background disabled:opacity-60"
                  disabled={loadingProductId === product.id}
                >
                  {loadingProductId === product.id
                    ? 'Commande...'
                    : 'Commander'}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
