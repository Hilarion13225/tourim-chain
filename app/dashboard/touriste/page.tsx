import { redirect } from 'next/navigation';
import { getRoleDashboardPath, getSessionUser } from '@/lib/session';
import DashboardSummaryClient from '@/app/dashboard/_components/dashboard-summary-client';
import DashboardRoleHero from '@/app/dashboard/_components/dashboard-role-hero';
import TouristeReservationsList from '@/app/dashboard/_components/touriste-reservations-list';

export default async function TouristeDashboardPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect('/login');
  }

  if (sessionUser.role !== 'TOURIST') {
    redirect(getRoleDashboardPath(sessionUser.role));
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <DashboardRoleHero
        title="Dashboard Touriste"
        subtitle="Suivez vos voyages, réservations et expériences culturelles en un seul espace."
        actions={[
          { label: 'Explorer les séjours', href: '/tourisme' },
          { label: 'Mes favoris', href: '/dashboard/touriste' },
        ]}
        stats={[
          { label: 'Réservations actives', value: '03' },
          { label: 'Événements à venir', value: '02' },
          { label: 'Produits achetés', value: '05' },
        ]}
      />
      <DashboardSummaryClient role="TOURIST" userId={sessionUser.userId} />
      <TouristeReservationsList userId={sessionUser.userId} />
    </main>
  );
}
