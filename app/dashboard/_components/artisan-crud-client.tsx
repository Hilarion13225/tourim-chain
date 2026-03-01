'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';

type Product = {
  id: string;
  nom: string;
  description: string;
  categorie: string;
  regionOrigine?: string | null;
  prix: string;
  stock: number;
  status: string;
  artisan?: {
    nom: string;
  };
  medias?: Array<{
    id: string;
    url: string;
    type: string;
  }>;
};

type ArtisanCrudClientProps = {
  userId: string;
};

export default function ArtisanCrudClient({ userId }: ArtisanCrudClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nom, setNom] = useState('Masque Dan sculpté main');
  const [description, setDescription] = useState(
    'Le masque Dan accompagne les rites communautaires et symbolise le lien entre art, spiritualité et transmission.',
  );
  const [regionOrigine, setRegionOrigine] = useState('Montagnes');
  const [culture, setCulture] = useState('Dan');
  const [prix, setPrix] = useState(45000);
  const [stock, setStock] = useState(1);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function resetForm() {
    setEditingId(null);
    setNom('Masque Dan sculpté main');
    setDescription(
      'Le masque Dan accompagne les rites communautaires et symbolise le lien entre art, spiritualité et transmission.',
    );
    setRegionOrigine('Montagnes');
    setCulture('Dan');
    setPrix(45000);
    setStock(1);
    setPhotoName('');
    setPhotoUrl('');
  }

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

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image.');
      return;
    }

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('image_read_failed'));
      reader.readAsDataURL(file);
    });

    setPhotoUrl(base64);
    setPhotoName(file.name);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!editingId && !photoUrl) {
      setError('La photo du produit est obligatoire.');
      return;
    }

    const response = await fetch(
      editingId
        ? `/api/artisan-products/${editingId}`
        : '/api/artisan-products',
      {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingId ? {} : { artisanId: userId }),
          nom,
          description,
          culture,
          regionOrigine,
          ...(photoUrl ? { imageUrl: photoUrl } : {}),
          prix,
          stock,
          status: 'ACTIVE',
        }),
      },
    );

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Création produit impossible');
      return;
    }

    setMessage(editingId ? 'Produit modifié' : 'Produit créé');
    resetForm();
    await loadProducts();
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setNom(product.nom);
    setDescription(product.description);
    setRegionOrigine(product.regionOrigine ?? '');
    setCulture(product.categorie);
    setPrix(Number(product.prix));
    setStock(product.stock);
    setPhotoUrl(product.medias?.[0]?.url ?? '');
    setPhotoName('');
    setError('');
    setMessage('');
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

      <form onSubmit={handleSubmit} className="grid gap-2 md:grid-cols-2">
        <input
          className="rounded-lg border border-black/10 bg-zinc-100 px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-800"
          value="Atelier Yacouba"
          readOnly
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          placeholder="Nom"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          required
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          placeholder="Région"
          value={regionOrigine}
          onChange={(event) => setRegionOrigine(event.target.value)}
          required
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          placeholder="Culture"
          value={culture}
          onChange={(event) => setCulture(event.target.value)}
          required
        />
        <textarea
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 md:col-span-2"
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          type="number"
          min={0}
          placeholder="Prix"
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
        <div className="space-y-1 md:col-span-2">
          <input
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            type="file"
            accept="image/*"
            onChange={(event) => void handlePhotoChange(event)}
            required={!editingId}
          />
          {photoName ? (
            <p className="text-xs text-zinc-500">{photoName}</p>
          ) : null}
        </div>
        {photoUrl ? (
          <div className="relative h-36 w-full overflow-hidden rounded-lg md:col-span-2">
            <Image
              src={photoUrl}
              alt="Prévisualisation produit"
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="flex gap-2 md:col-span-2">
          <button className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background">
            {editingId ? 'Enregistrer' : 'Créer'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm font-medium dark:border-white/15"
            >
              Annuler
            </button>
          ) : null}
        </div>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <div className="space-y-2">
        {products.map((product) => (
          <article
            key={product.id}
            className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
          >
            {product.medias?.[0]?.url ? (
              <div className="relative mb-2 h-32 w-full overflow-hidden rounded-lg">
                <Image
                  src={product.medias[0].url}
                  alt={product.nom}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ) : null}
            <p className="font-medium">{product.nom}</p>
            <p>Artisan: {product.artisan?.nom ?? 'Atelier Yacouba'}</p>
            <p>Région: {product.regionOrigine ?? '-'}</p>
            <p>Culture: {product.categorie}</p>
            <p>{product.description}</p>
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
                onClick={() => startEdit(product)}
                className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
              >
                Modifier
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
