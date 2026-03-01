'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type ArticleProduct = {
  id: string;
  nom: string;
  artisan: {
    nom: string;
  };
  prix: number;
  region: string;
  culture: string;
  histoire: string;
  stock: number;
  imageUrl?: string;
};

type ApiProduct = {
  id: string;
  nom: string;
  description: string;
  categorie: string;
  regionOrigine?: string | null;
  prix: string;
  stock: number;
  artisan?: {
    nom: string;
  };
  medias?: Array<{
    id: string;
    url: string;
    type: string;
  }>;
};

const suggestedArticles = [
  {
    id: 'a-1',
    titre: 'Grand-Bassam: mémoire coloniale et renaissance culturelle',
    resume:
      'Retour sur l’histoire de la première capitale coloniale et son rôle actuel dans le tourisme patrimonial ivoirien.',
  },
  {
    id: 'a-2',
    titre: 'Royaumes Akan: héritages, symboles et artisanat vivant',
    resume:
      'Décryptage des symboles royaux Akan, de leurs usages traditionnels et de leur influence dans la création artisanale.',
  },
  {
    id: 'a-3',
    titre: 'Traditions du Nord ivoirien: masques, rythmes et transmission',
    resume:
      'Comment les peuples du Nord perpétuent l’histoire à travers la sculpture, la danse et les objets rituels.',
  },
];

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;
}

export default function ArticlePage() {
  const router = useRouter();
  const [products, setProducts] = useState<ArticleProduct[]>([]);
  const [productsError, setProductsError] = useState('');
  const [productsLoading, setProductsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('Toutes');
  const [culture, setCulture] = useState('Toutes');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      setProductsLoading(true);
      setProductsError('');

      try {
        const response = await fetch('/api/artisan-products?status=ACTIVE');
        const data = (await response.json()) as
          | ApiProduct[]
          | { error?: string };

        if (!response.ok) {
          setProductsError(
            (data as { error?: string }).error ??
              'Erreur de chargement des produits.',
          );
          setProducts([]);
          return;
        }

        const normalized = (data as ApiProduct[]).map((item) => ({
          id: item.id,
          nom: item.nom,
          artisan: {
            nom: item.artisan?.nom ?? 'Artisan',
          },
          prix: Number(item.prix),
          region: item.regionOrigine ?? 'Non précisée',
          culture: item.categorie,
          histoire: item.description,
          stock: item.stock,
          imageUrl: item.medias?.find((media) => media.type === 'IMAGE')?.url,
        }));

        setProducts(normalized);
      } catch {
        setProductsError('Erreur réseau pendant le chargement des produits.');
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    }

    void loadProducts();
  }, []);

  const regions = useMemo(
    () => ['Toutes', ...new Set(products.map((item) => item.region))],
    [products],
  );
  const cultures = useMemo(
    () => ['Toutes', ...new Set(products.map((item) => item.culture))],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        `${item.nom} ${item.artisan.nom} ${item.region} ${item.culture}`
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesRegion = region === 'Toutes' ? true : item.region === region;
      const matchesCulture =
        culture === 'Toutes' ? true : item.culture === culture;

      return matchesSearch && matchesRegion && matchesCulture && item.stock > 0;
    });
  }, [products, search, region, culture]);

  async function handleBuy(productId: string) {
    setActionError('');
    setActionSuccess('');

    setLoadingProductId(productId);
    router.push(`/article/souvenir/${productId}`);
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold">Article</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Produits d’artisans ivoiriens filtrés par région et culture locale.
        </p>
      </header>

      <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un produit ou un artisan"
            className="rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          />

          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          >
            {regions.map((item) => (
              <option key={item} value={item}>
                Région: {item}
              </option>
            ))}
          </select>

          <select
            value={culture}
            onChange={(event) => setCulture(event.target.value)}
            className="rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          >
            {cultures.map((item) => (
              <option key={item} value={item}>
                Culture: {item}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-3">
        {productsError ? (
          <p className="text-sm text-red-600">{productsError}</p>
        ) : null}
        {actionError ? (
          <p className="text-sm text-red-600">{actionError}</p>
        ) : null}
        {actionSuccess ? (
          <p className="text-sm text-emerald-600">{actionSuccess}</p>
        ) : null}

        {productsLoading ? (
          <p className="text-sm text-zinc-500">Chargement des produits...</p>
        ) : (
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {filteredProducts.length} produit(s) trouvé(s)
            </p>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="space-y-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900"
                >
                  {product.imageUrl ? (
                    <div className="relative h-32 overflow-hidden rounded-xl">
                      <Image
                        src={product.imageUrl}
                        alt={product.nom}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-32 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                  )}
                  <h2 className="font-semibold">{product.nom}</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {product.artisan.nom}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Région: {product.region} • Culture: {product.culture}
                  </p>
                  <p className="text-sm font-semibold">
                    {formatMoney(product.prix)}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {product.histoire}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Stock: {product.stock}
                  </p>
                  <button
                    onClick={() => handleBuy(product.id)}
                    disabled={loadingProductId === product.id}
                    className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                  >
                    {loadingProductId === product.id
                      ? 'Achat...'
                      : 'Acheter ce souvenir'}
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900">
        <header>
          <h2 className="text-2xl font-bold">Articles suggérés & histoire</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Suggestions éditoriales pour comprendre l’origine culturelle des
            objets artisanaux ivoiriens.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {suggestedArticles.map((article) => (
            <article
              key={article.id}
              className="rounded-2xl border border-black/10 p-4 dark:border-white/15"
            >
              <h3 className="font-semibold">{article.titre}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {article.resume}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
