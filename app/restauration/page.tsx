'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type FoodView = 'RESTAURANTS' | 'PLATS';
type CuisineType = string;

type Restaurant = {
  id: string;
  nom: string;
  ville: string;
  cuisine: CuisineType;
  ticketMoyen: number;
  note: number;
  livraison: boolean;
};

type Dish = {
  id: string;
  restaurantId: string;
  nom: string;
  restaurant: string;
  ville: string;
  cuisine: CuisineType;
  prix: number;
  spicyLevel: number;
  livraison: boolean;
  stock: number;
  photoUrl?: string | null;
};

type ApiDish = {
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
  restaurant: {
    id: string;
    nom: string;
    email: string;
  };
};

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;
}

export default function RestaurationPage() {
  const router = useRouter();

  const [view, setView] = useState<FoodView>('RESTAURANTS');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dishesLoading, setDishesLoading] = useState(true);
  const [dishesError, setDishesError] = useState('');
  const [query, setQuery] = useState('');
  const [ville, setVille] = useState('Toutes');
  const [cuisine, setCuisine] = useState<'Toutes' | CuisineType>('Toutes');
  const [budgetMax, setBudgetMax] = useState(20000);
  const [noteMin, setNoteMin] = useState(8);
  const [spicyMax, setSpicyMax] = useState(5);
  const [livraisonOnly, setLivraisonOnly] = useState(false);
  const [loadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadDishes() {
      setDishesLoading(true);
      setDishesError('');

      try {
        const response = await fetch('/api/restaurant-dishes');
        const data = (await response.json()) as ApiDish[] | { error?: string };

        if (!response.ok) {
          setDishesError(
            (data as { error?: string }).error ??
              'Erreur de chargement des plats.',
          );
          setDishes([]);
          return;
        }

        const normalized = (data as ApiDish[]).map((item) => ({
          id: item.id,
          restaurantId: item.restaurant.id,
          nom: item.nom,
          restaurant: item.restaurant.nom,
          ville: item.ville,
          cuisine: item.cuisine,
          prix: Number(item.prix),
          spicyLevel: item.spicyLevel,
          livraison: item.livraison,
          stock: item.stock,
          photoUrl: item.photoUrl,
        }));

        setDishes(normalized);
      } catch {
        setDishesError('Erreur réseau pendant le chargement des plats.');
        setDishes([]);
      } finally {
        setDishesLoading(false);
      }
    }

    void loadDishes();
  }, []);

  const restaurants = useMemo<Restaurant[]>(() => {
    const byRestaurant = new Map<string, Dish[]>();

    for (const dish of dishes) {
      const list = byRestaurant.get(dish.restaurantId) ?? [];
      list.push(dish);
      byRestaurant.set(dish.restaurantId, list);
    }

    return [...byRestaurant.entries()].map(([restaurantId, items]) => {
      const first = items[0];
      const avgPrice =
        items.reduce((sum, item) => sum + item.prix, 0) /
        Math.max(1, items.length);

      return {
        id: restaurantId,
        nom: first.restaurant,
        ville: first.ville,
        cuisine: first.cuisine,
        ticketMoyen: Math.round(avgPrice),
        note: 8.5,
        livraison: items.some((item) => item.livraison),
      };
    });
  }, [dishes]);

  const availableCities = useMemo(() => {
    const source = view === 'RESTAURANTS' ? restaurants : dishes;
    return ['Toutes', ...new Set(source.map((item) => item.ville))];
  }, [view, restaurants, dishes]);

  const availableCuisines = useMemo(() => {
    const source = view === 'RESTAURANTS' ? restaurants : dishes;
    return ['Toutes', ...new Set(source.map((item) => item.cuisine))];
  }, [view, restaurants, dishes]);

  const filteredRestaurants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return restaurants.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        `${item.nom} ${item.ville} ${item.cuisine}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesVille = ville === 'Toutes' ? true : item.ville === ville;
      const matchesCuisine =
        cuisine === 'Toutes' ? true : item.cuisine === cuisine;
      const matchesBudget = item.ticketMoyen <= budgetMax;
      const matchesNote = item.note >= noteMin;
      const matchesLivraison = livraisonOnly ? item.livraison : true;

      return (
        matchesQuery &&
        matchesVille &&
        matchesCuisine &&
        matchesBudget &&
        matchesNote &&
        matchesLivraison
      );
    });
  }, [restaurants, query, ville, cuisine, budgetMax, noteMin, livraisonOnly]);

  const filteredDishes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return dishes.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        `${item.nom} ${item.restaurant} ${item.ville} ${item.cuisine}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesVille = ville === 'Toutes' ? true : item.ville === ville;
      const matchesCuisine =
        cuisine === 'Toutes' ? true : item.cuisine === cuisine;
      const matchesBudget = item.prix <= budgetMax;
      const matchesSpicy = item.spicyLevel <= spicyMax;
      const matchesLivraison = livraisonOnly ? item.livraison : true;

      return (
        matchesQuery &&
        matchesVille &&
        matchesCuisine &&
        matchesBudget &&
        matchesSpicy &&
        matchesLivraison
      );
    });
  }, [dishes, query, ville, cuisine, budgetMax, spicyMax, livraisonOnly]);

  function switchView(next: FoodView) {
    setView(next);
    setQuery('');
    setVille('Toutes');
    setCuisine('Toutes');
    setBudgetMax(next === 'RESTAURANTS' ? 20000 : 10000);
    setNoteMin(8);
    setSpicyMax(5);
    setLivraisonOnly(false);
  }

  function handleAction(itemId: string) {
    if (view === 'RESTAURANTS') {
      router.push(`/restauration/restaurant/${itemId}`);
      return;
    }

    router.push(`/restauration/plat/${itemId}`);
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold">Restauration</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Filtrez et réservez des restaurants ou commandez des plats ivoiriens.
        </p>
      </header>

      <section className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => switchView('RESTAURANTS')}
            className={
              view === 'RESTAURANTS'
                ? 'rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/15'
            }
          >
            Restaurants
          </button>
          <button
            onClick={() => switchView('PLATS')}
            className={
              view === 'PLATS'
                ? 'rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/15'
            }
          >
            Plats
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Filtres nourriture
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-medium">Recherche</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Plat, restaurant, ville..."
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ville</label>
            <select
              value={ville}
              onChange={(event) => setVille(event.target.value)}
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            >
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cuisine</label>
            <select
              value={cuisine}
              onChange={(event) =>
                setCuisine(event.target.value as 'Toutes' | CuisineType)
              }
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            >
              {availableCuisines.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Budget max ({formatMoney(budgetMax)})
            </label>
            <input
              type="range"
              min={3000}
              max={view === 'RESTAURANTS' ? 20000 : 10000}
              step={500}
              value={budgetMax}
              onChange={(event) => setBudgetMax(Number(event.target.value))}
              className="w-full"
            />
          </div>

          {view === 'RESTAURANTS' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Note minimum ({noteMin}/10)
              </label>
              <input
                type="range"
                min={7}
                max={10}
                step={0.1}
                value={noteMin}
                onChange={(event) => setNoteMin(Number(event.target.value))}
                className="w-full"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Épicé max ({spicyMax}/5)
              </label>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={spicyMax}
                onChange={(event) => setSpicyMax(Number(event.target.value))}
                className="w-full"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={livraisonOnly}
              onChange={(event) => setLivraisonOnly(event.target.checked)}
            />
            Livraison uniquement
          </label>
        </aside>

        <div className="space-y-4">
          {dishesError && view === 'PLATS' ? (
            <p className="text-sm text-red-600">{dishesError}</p>
          ) : null}
          {view === 'RESTAURANTS' ? (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {filteredRestaurants.length} restaurant(s) trouvé(s)
              </p>
              <section className="grid gap-4 md:grid-cols-2">
                {filteredRestaurants.map((item) => (
                  <article
                    key={item.id}
                    className="space-y-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900"
                  >
                    <h2 className="text-lg font-semibold">{item.nom}</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      📍 {item.ville} • {item.cuisine}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      Note {item.note}/10 •{' '}
                      {item.livraison ? 'Livraison disponible' : 'Sur place'}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        Ticket moyen {formatMoney(item.ticketMoyen)}
                      </p>
                      <button
                        onClick={() => handleAction(item.id)}
                        disabled={loadingId === item.id}
                        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                      >
                        {loadingId === item.id ? 'Réservation...' : 'Réserver'}
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            </>
          ) : (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {filteredDishes.length} plat(s) trouvé(s)
              </p>
              {dishesLoading ? (
                <p className="text-sm text-zinc-500">Chargement des plats...</p>
              ) : null}
              <section className="grid gap-4 md:grid-cols-2">
                {filteredDishes.map((item) => (
                  <article
                    key={item.id}
                    className="space-y-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900"
                  >
                    {item.photoUrl ? (
                      <div className="relative h-36 w-full overflow-hidden rounded-xl">
                        <Image
                          src={item.photoUrl}
                          alt={item.nom}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                    <h2 className="text-lg font-semibold">{item.nom}</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {item.restaurant} • {item.cuisine}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      📍 {item.ville} • Épicé {item.spicyLevel}/5 •{' '}
                      {item.livraison ? 'Livraison' : 'Sur place'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Stock: {item.stock}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {formatMoney(item.prix)}
                      </p>
                      <button
                        onClick={() => handleAction(item.id)}
                        disabled={loadingId === item.id}
                        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                      >
                        {loadingId === item.id ? 'Commande...' : 'Commander'}
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
