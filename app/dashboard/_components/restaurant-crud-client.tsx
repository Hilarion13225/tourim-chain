'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';

type Dish = {
  id: string;
  nom: string;
  description?: string | null;
  cuisine: string;
  ville: string;
  prix: string;
  spicyLevel: number;
  livraison: boolean;
  stock: number;
  disponible: boolean;
  photoUrl?: string | null;
};

type RestaurantOrder = {
  id: string;
  quantity: number;
  totalAmount: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  dish: {
    nom: string;
  };
  tourist: {
    nom: string;
    email: string;
  };
};

type RestaurantCrudClientProps = {
  userId: string;
};

function formatMoney(value: string | number) {
  const amount = Number(value);
  return `${new Intl.NumberFormat('fr-FR').format(Number.isNaN(amount) ? 0 : amount)} FCFA`;
}

export default function RestaurantCrudClient({
  userId,
}: RestaurantCrudClientProps) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);

  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('Ivoirienne');
  const [ville, setVille] = useState('Abidjan');
  const [prix, setPrix] = useState(3500);
  const [spicyLevel, setSpicyLevel] = useState(2);
  const [livraison, setLivraison] = useState(true);
  const [stock, setStock] = useState(10);
  const [disponible, setDisponible] = useState(true);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoName, setPhotoName] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function resetForm() {
    setEditingDishId(null);
    setNom('');
    setDescription('');
    setCuisine('Ivoirienne');
    setVille('Abidjan');
    setPrix(3500);
    setSpicyLevel(2);
    setLivraison(true);
    setStock(10);
    setDisponible(true);
    setPhotoUrl('');
    setPhotoName('');
  }

  async function loadDishes() {
    const response = await fetch(
      `/api/restaurant-dishes?restaurantId=${userId}`,
    );
    const data = (await response.json()) as Dish[] | { error?: string };

    if (!response.ok) {
      setError((data as { error?: string }).error ?? 'Erreur chargement plats');
      return;
    }

    setDishes(data as Dish[]);
  }

  async function loadOrders() {
    const response = await fetch('/api/restaurant-orders');
    const data = (await response.json()) as
      | RestaurantOrder[]
      | { error?: string };

    if (!response.ok) {
      setError(
        (data as { error?: string }).error ?? 'Erreur chargement commandes',
      );
      return;
    }

    setOrders(data as RestaurantOrder[]);
  }

  useEffect(() => {
    void loadDishes();
    void loadOrders();
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

    const response = await fetch(
      editingDishId
        ? `/api/restaurant-dishes/${editingDishId}`
        : '/api/restaurant-dishes',
      {
        method: editingDishId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom,
          description,
          cuisine,
          ville,
          prix,
          spicyLevel,
          livraison,
          stock,
          disponible,
          ...(photoUrl ? { photoUrl } : {}),
        }),
      },
    );

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Opération impossible');
      return;
    }

    setMessage(editingDishId ? 'Plat modifié' : 'Plat créé');
    resetForm();
    await loadDishes();
  }

  function startEdit(dish: Dish) {
    setEditingDishId(dish.id);
    setNom(dish.nom);
    setDescription(dish.description ?? '');
    setCuisine(dish.cuisine);
    setVille(dish.ville);
    setPrix(Number(dish.prix));
    setSpicyLevel(dish.spicyLevel);
    setLivraison(dish.livraison);
    setStock(dish.stock);
    setDisponible(dish.disponible);
    setPhotoUrl(dish.photoUrl ?? '');
    setPhotoName('');
    setMessage('');
    setError('');
  }

  async function handleDelete(dishId: string) {
    setError('');
    setMessage('');

    const response = await fetch(`/api/restaurant-dishes/${dishId}`, {
      method: 'DELETE',
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Suppression impossible');
      return;
    }

    if (editingDishId === dishId) {
      resetForm();
    }

    setMessage('Plat supprimé');
    await loadDishes();
  }

  async function handleStatusUpdate(
    orderId: string,
    status: RestaurantOrder['status'],
  ) {
    setError('');
    setMessage('');

    const response = await fetch(`/api/restaurant-orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Mise à jour statut impossible');
      return;
    }

    setMessage('Statut commande mis à jour');
    await loadOrders();
  }

  return (
    <section className="space-y-6">
      <article className="space-y-4 rounded-2xl border border-black/10 p-5 dark:border-white/15">
        <h2 className="text-lg font-semibold">CRUD Restaurant — Plats</h2>

        <form onSubmit={handleSubmit} className="grid gap-2 md:grid-cols-2">
          <input
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            placeholder="Nom du plat"
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            required
          />
          <input
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            placeholder="Cuisine"
            value={cuisine}
            onChange={(event) => setCuisine(event.target.value)}
            required
          />
          <input
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            placeholder="Ville"
            value={ville}
            onChange={(event) => setVille(event.target.value)}
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
            min={1}
            max={5}
            placeholder="Niveau épicé"
            value={spicyLevel}
            onChange={(event) => setSpicyLevel(Number(event.target.value) || 1)}
            required
          />
          <input
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            type="number"
            min={0}
            placeholder="Stock"
            value={stock}
            onChange={(event) => setStock(Number(event.target.value) || 0)}
            required
          />
          <textarea
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 md:col-span-2"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <div className="space-y-1 md:col-span-2">
            <input
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              type="file"
              accept="image/*"
              onChange={(event) => void handlePhotoChange(event)}
            />
            {photoName ? (
              <p className="text-xs text-zinc-500">{photoName}</p>
            ) : null}
          </div>

          {photoUrl ? (
            <div className="relative h-36 w-full overflow-hidden rounded-lg md:col-span-2">
              <Image
                src={photoUrl}
                alt="Prévisualisation plat"
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={livraison}
              onChange={(event) => setLivraison(event.target.checked)}
            />
            Livraison
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={disponible}
              onChange={(event) => setDisponible(event.target.checked)}
            />
            Disponible
          </label>

          <div className="flex gap-2 md:col-span-2">
            <button className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background">
              {editingDishId ? 'Enregistrer' : 'Créer'}
            </button>
            {editingDishId ? (
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
          {dishes.map((dish) => (
            <article
              key={dish.id}
              className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
            >
              {dish.photoUrl ? (
                <div className="relative mb-2 h-32 w-full overflow-hidden rounded-lg">
                  <Image
                    src={dish.photoUrl}
                    alt={dish.nom}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <p className="font-medium">{dish.nom}</p>
              <p>
                {dish.cuisine} • {dish.ville}
              </p>
              <p>{dish.description}</p>
              <p>Prix: {formatMoney(dish.prix)}</p>
              <p>Stock: {dish.stock}</p>
              <p>Épicé: {dish.spicyLevel}/5</p>
              <p>
                Livraison: {dish.livraison ? 'Oui' : 'Non'} • Disponible:{' '}
                {dish.disponible ? 'Oui' : 'Non'}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => startEdit(dish)}
                  className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
                >
                  Modifier
                </button>
                <button
                  onClick={() => void handleDelete(dish.id)}
                  className="rounded-md bg-zinc-900 px-2 py-1 text-white dark:bg-zinc-100 dark:text-black"
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      </article>

      <article className="space-y-4 rounded-2xl border border-black/10 p-5 dark:border-white/15">
        <h2 className="text-lg font-semibold">Commandes touristes reçues</h2>
        <div className="space-y-2">
          {orders.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Aucune commande pour le moment.
            </p>
          ) : null}

          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
            >
              <p className="font-medium">{order.dish.nom}</p>
              <p>
                Touriste: {order.tourist.nom} ({order.tourist.email})
              </p>
              <p>
                Quantité: {order.quantity} • Total:{' '}
                {formatMoney(order.totalAmount)}
              </p>
              <p>Statut: {order.status}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => void handleStatusUpdate(order.id, 'PENDING')}
                  className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
                >
                  PENDING
                </button>
                <button
                  onClick={() => void handleStatusUpdate(order.id, 'SHIPPED')}
                  className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
                >
                  SHIPPED
                </button>
                <button
                  onClick={() => void handleStatusUpdate(order.id, 'DELIVERED')}
                  className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
                >
                  DELIVERED
                </button>
                <button
                  onClick={() => void handleStatusUpdate(order.id, 'CANCELLED')}
                  className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
                >
                  CANCELLED
                </button>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
