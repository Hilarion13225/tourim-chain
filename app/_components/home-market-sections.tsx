'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  filterMockSites,
  mockEvents,
  mockProducts,
} from '@/lib/mock-tourism-data';

const USE_MOCK_DATA = true;

type Site = {
  id: string;
  nom: string;
  region: string;
  description: string;
  categorieTourisme: string;
};

type EventTicketType = {
  id: string;
  nom: string;
  prix: string;
  quantityTotal: number;
  quantitySold: number;
};

type EventItem = {
  id: string;
  nom: string;
  lieu: string;
  region: string;
  startAt: string;
  ticketTypes: EventTicketType[];
};

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

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function formatMoney(value: string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat('fr-FR').format(amount);
}

export default function HomeMarketSections() {
  const router = useRouter();
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [categorie, setCategorie] = useState('');
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState('');
  const [reserveMessage, setReserveMessage] = useState('');
  const [reserveError, setReserveError] = useState('');
  const [loadingSiteId, setLoadingSiteId] = useState<string | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [buyMessage, setBuyMessage] = useState('');
  const [buyError, setBuyError] = useState('');
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [orderMessage, setOrderMessage] = useState('');
  const [orderError, setOrderError] = useState('');
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  async function loadSites() {
    setSitesLoading(true);
    setSitesError('');

    if (USE_MOCK_DATA) {
      const filtered = filterMockSites({ query, region, categorie });
      setSites(filtered);
      setSitesLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();

      if (query) {
        params.set('q', query);
      }

      if (region) {
        params.set('region', region);
      }

      if (categorie) {
        params.set('categorie', categorie);
      }

      const response = await fetch(`/api/sites?${params.toString()}`);
      const data = (await response.json()) as Site[] | { error?: string };

      if (!response.ok) {
        setSitesError(
          (data as { error?: string }).error ?? 'Erreur de chargement',
        );
        setSites([]);
        return;
      }

      setSites(data as Site[]);
    } catch {
      setSitesError('Erreur réseau, veuillez réessayer.');
    } finally {
      setSitesLoading(false);
    }
  }

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

    async function loadEvents() {
      setEventsLoading(true);
      setEventsError('');

      if (USE_MOCK_DATA) {
        setEvents(mockEvents);
        setEventsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/events');
        const data = (await response.json()) as
          | EventItem[]
          | { error?: string };

        if (!response.ok) {
          setEventsError(
            (data as { error?: string }).error ?? 'Erreur de chargement',
          );
          setEvents([]);
          return;
        }

        setEvents(data as EventItem[]);
      } catch {
        setEventsError('Erreur réseau, veuillez réessayer.');
      } finally {
        setEventsLoading(false);
      }
    }

    async function loadProducts() {
      setProductsLoading(true);
      setProductsError('');

      if (USE_MOCK_DATA) {
        setProducts(mockProducts);
        setProductsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/artisan-products');
        const data = (await response.json()) as Product[] | { error?: string };

        if (!response.ok) {
          setProductsError(
            (data as { error?: string }).error ?? 'Erreur de chargement',
          );
          setProducts([]);
          return;
        }

        setProducts(data as Product[]);
      } catch {
        setProductsError('Erreur réseau, veuillez réessayer.');
      } finally {
        setProductsLoading(false);
      }
    }

    void loadSession();
    void loadSites();
    void loadEvents();
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadSites();
  }

  async function handleReserve(siteId: string) {
    setReserveError('');
    setReserveMessage('');

    if (!sessionUserId) {
      router.push('/login');
      return;
    }

    setLoadingSiteId(siteId);

    if (USE_MOCK_DATA) {
      setReserveMessage(`Réservation démo confirmée (#DEMO-${siteId}).`);
      setLoadingSiteId(null);
      return;
    }

    try {
      const response = await fetch('/api/bookings/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, participants: 1 }),
      });

      const data = (await response.json()) as {
        error?: string;
        booking?: { id?: string };
      };

      if (!response.ok) {
        setReserveError(data.error ?? 'Réservation impossible');
        return;
      }

      setReserveMessage(
        `Réservation confirmée (#${data.booking?.id ?? 'N/A'}).`,
      );
    } catch {
      setReserveError('Erreur réseau pendant la réservation.');
    } finally {
      setLoadingSiteId(null);
    }
  }

  async function handleBuy(eventId: string) {
    setBuyError('');
    setBuyMessage('');

    if (!sessionUserId) {
      router.push('/login');
      return;
    }

    setLoadingEventId(eventId);

    if (USE_MOCK_DATA) {
      setBuyMessage('Billet acheté avec succès (mode démo).');
      setLoadingEventId(null);
      return;
    }

    try {
      const response = await fetch('/api/events/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, quantity: 1 }),
      });

      const data = (await response.json()) as {
        error?: string;
        totalAmount?: number;
      };

      if (!response.ok) {
        setBuyError(data.error ?? 'Achat impossible');
        return;
      }

      setBuyMessage(
        `Billet acheté avec succès (${new Intl.NumberFormat('fr-FR').format(data.totalAmount ?? 0)} FCFA).`,
      );
    } catch {
      setBuyError('Erreur réseau pendant l’achat.');
    } finally {
      setLoadingEventId(null);
    }
  }

  async function handleOrder(productId: string) {
    setOrderError('');
    setOrderMessage('');

    if (!sessionUserId) {
      router.push('/login');
      return;
    }

    setLoadingProductId(productId);

    if (USE_MOCK_DATA) {
      setOrderMessage(`Commande validée (mode démo) pour ${productId}.`);
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
        setOrderError(data.error ?? 'Commande impossible');
        return;
      }

      setOrderMessage(
        `Commande validée (${new Intl.NumberFormat('fr-FR').format(data.totalAmount ?? 0)} FCFA).`,
      );
    } catch {
      setOrderError('Erreur réseau pendant la commande.');
    } finally {
      setLoadingProductId(null);
    }
  }

  return (
    <>
      <section id="explorer" className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Explorer la Côte d’Ivoire</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Découvrez les lieux incontournables de Côte d’Ivoire, filtrés par
            région et type d’expérience.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="grid gap-3 rounded-2xl border border-black/10 p-4 dark:border-white/15 md:grid-cols-4"
        >
          <input
            className="rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            placeholder="Rechercher un site"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <input
            className="rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            placeholder="Région"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          />
          <input
            className="rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            placeholder="Catégorie (CULTURE, NATURE...)"
            value={categorie}
            onChange={(event) => setCategorie(event.target.value.toUpperCase())}
          />
          <button className="tc-cta rounded-xl px-4 py-2 text-sm font-medium">
            Appliquer
          </button>
        </form>

        {sitesError ? (
          <p className="text-sm text-red-600">{sitesError}</p>
        ) : null}
        {reserveError ? (
          <p className="text-sm text-red-600">{reserveError}</p>
        ) : null}
        {reserveMessage ? (
          <p className="text-sm text-emerald-600">{reserveMessage}</p>
        ) : null}

        {sitesLoading ? (
          <p className="text-sm text-zinc-500">Chargement des sites...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sites.map((site) => (
              <article
                key={site.id}
                className="space-y-3 rounded-2xl border border-black/10 p-4 dark:border-white/15"
              >
                <div className="h-32 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                <h3 className="font-semibold">{site.nom}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {site.region}
                </p>
                <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {site.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs">{site.categorieTourisme}</span>
                  <button
                    onClick={() => void handleReserve(site.id)}
                    className="tc-cta rounded-full px-3 py-1.5 text-xs disabled:opacity-60"
                    disabled={loadingSiteId === site.id}
                  >
                    {loadingSiteId === site.id ? 'Réservation...' : 'Réserver'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="evenements" className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">
            Événements en Côte d’Ivoire
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Réservez vos billets culturels, festivals ivoiriens et expériences
            live avec contrôle QR.
          </p>
        </div>

        {eventsError ? (
          <p className="text-sm text-red-600">{eventsError}</p>
        ) : null}
        {buyError ? <p className="text-sm text-red-600">{buyError}</p> : null}
        {buyMessage ? (
          <p className="text-sm text-emerald-600">{buyMessage}</p>
        ) : null}

        {eventsLoading ? (
          <p className="text-sm text-zinc-500">Chargement des événements...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {events.map((eventItem) => {
              const totalTickets = eventItem.ticketTypes.reduce(
                (sum, ticketType) => sum + ticketType.quantityTotal,
                0,
              );
              const soldTickets = eventItem.ticketTypes.reduce(
                (sum, ticketType) => sum + ticketType.quantitySold,
                0,
              );

              return (
                <article
                  key={eventItem.id}
                  className="space-y-2 rounded-2xl border border-black/10 p-5 dark:border-white/15"
                >
                  <div className="h-32 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                  <h3 className="font-semibold">{eventItem.nom}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {eventItem.lieu}, {eventItem.region}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {formatDate(eventItem.startAt)}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span>
                      {Math.max(totalTickets - soldTickets, 0)} billets restants
                    </span>
                    <button
                      onClick={() => void handleBuy(eventItem.id)}
                      className="tc-cta rounded-full px-3 py-1.5 text-xs disabled:opacity-60"
                      disabled={loadingEventId === eventItem.id}
                    >
                      {loadingEventId === eventItem.id ? 'Achat...' : 'Acheter'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section id="artisans" className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Artisans de Côte d’Ivoire</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Marketplace de produits culturels ivoiriens authentiques avec
            certificats blockchain.
          </p>
        </div>

        {productsError ? (
          <p className="text-sm text-red-600">{productsError}</p>
        ) : null}
        {orderError ? (
          <p className="text-sm text-red-600">{orderError}</p>
        ) : null}
        {orderMessage ? (
          <p className="text-sm text-emerald-600">{orderMessage}</p>
        ) : null}

        {productsLoading ? (
          <p className="text-sm text-zinc-500">Chargement des produits...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => (
              <article
                key={product.id}
                className="space-y-3 rounded-2xl border border-black/10 p-4 dark:border-white/15"
              >
                <div className="h-32 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                <h3 className="font-semibold">{product.nom}</h3>
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
                    className="tc-cta rounded-full px-3 py-1.5 disabled:opacity-60"
                    disabled={loadingProductId === product.id}
                  >
                    {loadingProductId === product.id
                      ? 'Commande...'
                      : 'Commander'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
