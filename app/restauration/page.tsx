'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type FoodView = 'RESTAURANTS' | 'PLATS';
type CuisineType = 'Ivoirienne' | 'Africaine' | 'Street Food' | 'Fusion';

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
  nom: string;
  restaurant: string;
  ville: string;
  cuisine: CuisineType;
  prix: number;
  spicyLevel: 1 | 2 | 3 | 4 | 5;
  livraison: boolean;
};

const restaurants: Restaurant[] = [
  {
    id: 'res-1',
    nom: 'Garba Signature',
    ville: 'Abidjan',
    cuisine: 'Street Food',
    ticketMoyen: 7000,
    note: 8.8,
    livraison: true,
  },
  {
    id: 'res-2',
    nom: 'Attiéké & Grill',
    ville: 'Grand-Bassam',
    cuisine: 'Ivoirienne',
    ticketMoyen: 12000,
    note: 9.1,
    livraison: false,
  },
  {
    id: 'res-3',
    nom: 'Table Baoulé',
    ville: 'Yamoussoukro',
    cuisine: 'Africaine',
    ticketMoyen: 9500,
    note: 8.4,
    livraison: true,
  },
  {
    id: 'res-4',
    nom: 'Lagune Fusion',
    ville: 'Assinie',
    cuisine: 'Fusion',
    ticketMoyen: 18000,
    note: 8.9,
    livraison: true,
  },
];

const dishes: Dish[] = [
  {
    id: 'dish-1',
    nom: 'Garba thon + attiéké',
    restaurant: 'Garba Signature',
    ville: 'Abidjan',
    cuisine: 'Street Food',
    prix: 3500,
    spicyLevel: 3,
    livraison: true,
  },
  {
    id: 'dish-2',
    nom: 'Poisson braisé + attiéké',
    restaurant: 'Attiéké & Grill',
    ville: 'Grand-Bassam',
    cuisine: 'Ivoirienne',
    prix: 8500,
    spicyLevel: 2,
    livraison: false,
  },
  {
    id: 'dish-3',
    nom: 'Kedjenou de poulet',
    restaurant: 'Table Baoulé',
    ville: 'Yamoussoukro',
    cuisine: 'Africaine',
    prix: 6500,
    spicyLevel: 4,
    livraison: true,
  },
  {
    id: 'dish-4',
    nom: 'Alloco premium + grillades',
    restaurant: 'Lagune Fusion',
    ville: 'Assinie',
    cuisine: 'Fusion',
    prix: 7800,
    spicyLevel: 2,
    livraison: true,
  },
];

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;
}

export default function RestaurationPage() {
  const router = useRouter();

  const [view, setView] = useState<FoodView>('RESTAURANTS');
  const [query, setQuery] = useState('');
  const [ville, setVille] = useState('Toutes');
  const [cuisine, setCuisine] = useState<'Toutes' | CuisineType>('Toutes');
  const [budgetMax, setBudgetMax] = useState(20000);
  const [noteMin, setNoteMin] = useState(8);
  const [spicyMax, setSpicyMax] = useState(5);
  const [livraisonOnly, setLivraisonOnly] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [feedback, setFeedback] = useState('');

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

  const availableCities = useMemo(() => {
    const source = view === 'RESTAURANTS' ? restaurants : dishes;
    return ['Toutes', ...new Set(source.map((item) => item.ville))];
  }, [view]);

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
  }, [query, ville, cuisine, budgetMax, noteMin, livraisonOnly]);

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
  }, [query, ville, cuisine, budgetMax, spicyMax, livraisonOnly]);

  function switchView(next: FoodView) {
    setView(next);
    setQuery('');
    setVille('Toutes');
    setCuisine('Toutes');
    setBudgetMax(next === 'RESTAURANTS' ? 20000 : 10000);
    setNoteMin(8);
    setSpicyMax(5);
    setLivraisonOnly(false);
    setActionError('');
    setFeedback('');
  }

  async function handleAction(itemId: string) {
    setActionError('');
    setFeedback('');

    if (!sessionUserId) {
      router.push('/login');
      return;
    }

    setLoadingId(itemId);

    const restaurant = restaurants.find((item) => item.id === itemId);
    const dish = dishes.find((item) => item.id === itemId);

    const actionType = view === 'RESTAURANTS' ? 'FOOD_RESTAURANT' : 'FOOD_DISH';
    const itemLabel = restaurant?.nom ?? dish?.nom ?? itemId;
    const amount = restaurant?.ticketMoyen ?? dish?.prix ?? 1000;

    try {
      const response = await fetch('/api/tourist-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType,
          itemId,
          itemLabel,
          amount,
          participants: 1,
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

        setActionError(data.error ?? 'Action impossible.');
        return;
      }

      setFeedback(
        `${data.message ?? 'Action confirmée.'} Réf: ${data.reference ?? 'N/A'}`,
      );
    } catch {
      setActionError('Erreur réseau pendant l’action.');
    } finally {
      setLoadingId(null);
    }
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
              <option value="Toutes">Toutes</option>
              <option value="Ivoirienne">Ivoirienne</option>
              <option value="Africaine">Africaine</option>
              <option value="Street Food">Street Food</option>
              <option value="Fusion">Fusion</option>
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
          {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
          {feedback ? (
            <p className="text-sm text-emerald-600">{feedback}</p>
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
              <section className="grid gap-4 md:grid-cols-2">
                {filteredDishes.map((item) => (
                  <article
                    key={item.id}
                    className="space-y-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900"
                  >
                    <h2 className="text-lg font-semibold">{item.nom}</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {item.restaurant} • {item.cuisine}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      📍 {item.ville} • Épicé {item.spicyLevel}/5 •{' '}
                      {item.livraison ? 'Livraison' : 'Sur place'}
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
