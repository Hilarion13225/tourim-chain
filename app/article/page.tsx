'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type ArticleProduct = {
  id: string;
  nom: string;
  artisan: string;
  prix: number;
  region: string;
  culture: string;
  histoire: string;
};

const artisanProducts: ArticleProduct[] = [
  {
    id: 'p-1',
    nom: 'Masque Dan sculpté main',
    artisan: 'Atelier Yacouba',
    prix: 45000,
    region: 'Montagnes',
    culture: 'Dan',
    histoire:
      'Le masque Dan accompagne les rites communautaires et symbolise le lien entre art, spiritualité et transmission.',
  },
  {
    id: 'p-2',
    nom: 'Pagne tissé Baoulé',
    artisan: 'Coopérative N’Zi',
    prix: 28000,
    region: 'Lacs',
    culture: 'Baoulé',
    histoire:
      'Le tissage baoulé valorise les savoir-faire féminins et les motifs identitaires transmis de génération en génération.',
  },
  {
    id: 'p-3',
    nom: 'Statuette Sénoufo en ébène',
    artisan: 'Maison Koffi Art',
    prix: 62000,
    region: 'Savanes',
    culture: 'Sénoufo',
    histoire:
      'La sculpture sénoufo incarne les valeurs de protection, d’autorité et d’ancrage ancestral au sein des villages.',
  },
  {
    id: 'p-4',
    nom: 'Parure Akan en perles',
    artisan: 'Créations Adjoua',
    prix: 35000,
    region: 'Sud-Comoé',
    culture: 'Akan',
    histoire:
      'Les parures en perles Akan sont liées aux cérémonies et à l’expression du statut social dans les cours royales.',
  },
  {
    id: 'p-5',
    nom: 'Tabouret royal Agni',
    artisan: 'Art Bois Assouan',
    prix: 52000,
    region: 'Indénié-Djuablin',
    culture: 'Agni',
    histoire:
      'Le tabouret royal est un objet de prestige, associé à la légitimité des chefs traditionnels dans la culture Agni.',
  },
  {
    id: 'p-6',
    nom: 'Tambour Attié décoratif',
    artisan: 'Studio Ebrié Craft',
    prix: 26000,
    region: 'Lagunes',
    culture: 'Attié',
    histoire:
      'Le tambour accompagne les célébrations locales et maintient vivant le langage rythmique propre aux communautés Attié.',
  },
];

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
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('Toutes');
  const [culture, setCulture] = useState('Toutes');
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

    void loadSession();
  }, []);

  const regions = useMemo(
    () => ['Toutes', ...new Set(artisanProducts.map((item) => item.region))],
    [],
  );
  const cultures = useMemo(
    () => ['Toutes', ...new Set(artisanProducts.map((item) => item.culture))],
    [],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return artisanProducts.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        `${item.nom} ${item.artisan} ${item.region} ${item.culture}`
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesRegion = region === 'Toutes' ? true : item.region === region;
      const matchesCulture =
        culture === 'Toutes' ? true : item.culture === culture;

      return matchesSearch && matchesRegion && matchesCulture;
    });
  }, [search, region, culture]);

  async function handleBuy(productId: string) {
    setActionError('');
    setActionSuccess('');

    if (!sessionUserId) {
      router.push('/login');
      return;
    }

    setLoadingProductId(productId);

    try {
      const product = artisanProducts.find((item) => item.id === productId);

      const response = await fetch('/api/tourist-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'SOUVENIR_PURCHASE',
          itemId: productId,
          itemLabel: product?.nom ?? productId,
          amount: product?.prix ?? 1000,
          quantity: 1,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        reference?: string;
      };

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }

        setActionError(data.error ?? 'Achat impossible.');
        return;
      }

      setActionSuccess(
        `${data.message ?? 'Achat confirmé.'} Réf: ${data.reference ?? 'N/A'}`,
      );
    } catch {
      setActionError('Erreur réseau pendant l’achat.');
    } finally {
      setLoadingProductId(null);
    }
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
        {actionError ? (
          <p className="text-sm text-red-600">{actionError}</p>
        ) : null}
        {actionSuccess ? (
          <p className="text-sm text-emerald-600">{actionSuccess}</p>
        ) : null}

        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {filteredProducts.length} produit(s) trouvé(s)
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="space-y-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900"
            >
              <div className="h-32 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
              <h2 className="font-semibold">{product.nom}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {product.artisan}
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
