'use client';

import { FormEvent, useEffect, useState } from 'react';

type Product = {
  id: string;
  nom: string;
  categorie: string;
  prix: string;
  stock: number;
  status: string;
};

type ArtisanCrudClientProps = {
  userId: string;
};

export default function ArtisanCrudClient({ userId }: ArtisanCrudClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [nom, setNom] = useState('');
  const description = 'Produit culturel';
  const [categorie, setCategorie] = useState('Artisanat');
  const [prix, setPrix] = useState(10000);
  const [stock, setStock] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadProducts() {
    const response = await fetch(
      `/api/artisan-products?artisanId=${userId}&status=ACTIVE`,
    );
    const data = (await response.json()) as Product[] | { error?: string };

    if (!response.ok) {
      setError(
        (data as { error?: string }).error ?? 'Erreur chargement produits',
      );
      return;
    }

    setProducts(data as Product[]);
  }

  useEffect(() => {
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    const response = await fetch('/api/artisan-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artisanId: userId,
        nom,
        description,
        categorie,
        prix,
        stock,
        status: 'ACTIVE',
      }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Création produit impossible');
      return;
    }

    setMessage('Produit créé');
    setNom('');
    setPrix(10000);
    setStock(1);
    await loadProducts();
  }

  async function increaseStock(product: Product) {
    const response = await fetch(`/api/artisan-products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: product.stock + 1 }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Mise à jour stock impossible');
      return;
    }

    setMessage('Stock mis à jour');
    await loadProducts();
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/artisan-products/${id}`, {
      method: 'DELETE',
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Suppression produit impossible');
      return;
    }

    setMessage('Produit supprimé');
    await loadProducts();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-black/10 p-5 dark:border-white/15">
      <h2 className="text-lg font-semibold">CRUD Artisan — Produits</h2>

      <form onSubmit={handleCreate} className="grid gap-2 md:grid-cols-5">
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          placeholder="Nom produit"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          required
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          placeholder="Catégorie"
          value={categorie}
          onChange={(event) => setCategorie(event.target.value)}
          required
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          type="number"
          min={0}
          value={prix}
          onChange={(event) => setPrix(Number(event.target.value) || 0)}
          required
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          type="number"
          min={0}
          value={stock}
          onChange={(event) => setStock(Number(event.target.value) || 0)}
          required
        />
        <button className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background">
          Créer
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <div className="space-y-2">
        {products.map((product) => (
          <article
            key={product.id}
            className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
          >
            <p className="font-medium">{product.nom}</p>
            <p>Catégorie: {product.categorie}</p>
            <p>Prix: {product.prix} FCFA</p>
            <p>Stock: {product.stock}</p>
            <p>Statut: {product.status}</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => void increaseStock(product)}
                className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
              >
                +1 stock
              </button>
              <button
                onClick={() => void handleDelete(product.id)}
                className="rounded-md bg-zinc-900 px-2 py-1 text-white dark:bg-zinc-100 dark:text-black"
              >
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
