import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getRoleDashboardPath, getSessionUser } from '@/lib/session';

type NavItem = {
  label: string;
  href: string;
};

function getRoleNavItems(role: string): NavItem[] {
  if (role === 'GUIDE') {
    return [
      { label: 'Dashboard Guide', href: '/dashboard/guide' },
      { label: 'Calendrier', href: '/dashboard/guide' },
      { label: 'Réservations', href: '/dashboard/guide' },
      { label: 'Revenus', href: '/dashboard/guide' },
    ];
  }

  if (role === 'ARTISAN') {
    return [
      { label: 'Dashboard Artisan', href: '/dashboard/artisan' },
      { label: 'Produits', href: '/dashboard/artisan' },
      { label: 'Commandes', href: '/dashboard/artisan' },
      { label: 'Certificats', href: '/dashboard/artisan' },
    ];
  }

  if (role === 'ORGANIZER') {
    return [
      { label: 'Dashboard Organisateur', href: '/dashboard/organisateur' },
      { label: 'Gestion événements', href: '/dashboard/organisateur' },
      { label: 'Scan billets', href: '/dashboard/organisateur' },
    ];
  }

  if (role === 'ACCOMMODATION_COMPANY') {
    return [
      { label: 'Dashboard Hébergement', href: '/dashboard/hebergement' },
      {
        label: 'Mes hébergements',
        href: '/dashboard/hebergement/mes-hebergements',
      },
      { label: 'Disponibilités', href: '/dashboard/hebergement' },
    ];
  }

  if (role === 'VEHICLE_RENTAL_COMPANY') {
    return [
      {
        label: 'Dashboard Location Véhicule',
        href: '/dashboard/location-vehicule',
      },
      {
        label: 'Ma flotte',
        href: '/dashboard/location-vehicule',
      },
      {
        label: 'Disponibilités',
        href: '/dashboard/location-vehicule',
      },
    ];
  }

  if (role === 'ADMIN') {
    return [
      { label: 'Dashboard Admin', href: '/dashboard/admin' },
      { label: 'Validation acteurs', href: '/dashboard/admin' },
      { label: 'Analytics nationaux', href: '/dashboard/admin' },
    ];
  }

  return [
    { label: 'Dashboard Touriste', href: '/dashboard/touriste' },
    { label: 'Voyages', href: '/dashboard/touriste' },
    { label: 'Billets NFT', href: '/dashboard/touriste' },
    { label: 'Favoris', href: '/dashboard/touriste' },
  ];
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect('/login');
  }

  const navItems = getRoleNavItems(sessionUser.role);

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr] lg:px-8">
      <aside className="h-fit rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900 lg:sticky lg:top-6">
        <div className="mb-4 border-b border-black/10 pb-4 dark:border-white/15">
          <p className="text-lg font-bold">
            <span>tourisme</span>
            <span className="ml-1 text-orange-500">Ci</span>
          </p>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Espace connecté
          </p>
          <p className="mt-1 text-sm font-semibold">{sessionUser.email}</p>
          <p className="text-xs text-zinc-500">Rôle: {sessionUser.role}</p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 space-y-2 border-t border-black/10 pt-4 dark:border-white/15">
          <Link
            href={getRoleDashboardPath(sessionUser.role)}
            className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Accueil dashboard
          </Link>
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Retour au site public
          </Link>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="w-full rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      <section>{children}</section>
    </div>
  );
}
