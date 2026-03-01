import { redirect } from 'next/navigation';
import { getRoleDashboardPath, getSessionUser } from '@/lib/session';
import DashboardSummaryClient from '@/app/dashboard/_components/dashboard-summary-client';
import DashboardRoleHero from '@/app/dashboard/_components/dashboard-role-hero';
import RestaurantCrudClient from '@/app/dashboard/_components/restaurant-crud-client';

export default async function RestaurantDashboardPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect('/login');
  }

  if (sessionUser.role !== 'RESTAURANT') {
    redirect(getRoleDashboardPath(sessionUser.role));
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <DashboardRoleHero
        title="Dashboard Restaurant"
        subtitle="Publiez vos plats, gérez les disponibilités et suivez les commandes des touristes en temps réel."
        actions={[
          { label: 'Ajouter un plat', href: '/dashboard/restaurant' },
          { label: 'Voir les commandes', href: '/dashboard/restaurant' },
        ]}
        stats={[
          { label: 'Plats actifs', value: '—' },
          { label: 'Commandes du jour', value: '—' },
          { label: 'Livraisons', value: '—' },
        ]}
      />

      <DashboardSummaryClient role="RESTAURANT" userId={sessionUser.userId} />
      <RestaurantCrudClient userId={sessionUser.userId} />
    </main>
  );
}
