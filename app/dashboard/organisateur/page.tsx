import { redirect } from 'next/navigation';
import { getRoleDashboardPath, getSessionUser } from '@/lib/session';
import DashboardSummaryClient from '@/app/dashboard/_components/dashboard-summary-client';
import OrganisateurCrudClient from '@/app/dashboard/_components/organisateur-crud-client';
import DashboardRoleHero from '@/app/dashboard/_components/dashboard-role-hero';

export default async function OrganisateurDashboardPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect('/login');
  }

  if (sessionUser.role !== 'ORGANIZER') {
    redirect(getRoleDashboardPath(sessionUser.role));
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <DashboardRoleHero
        title="Dashboard Organisateur"
        subtitle="Créez et supervisez vos événements avec un pilotage complet des ventes et accès."
        actions={[
          { label: 'Créer un événement', href: '/dashboard/organisateur' },
          { label: 'Suivre billetterie', href: '/dashboard/organisateur' },
        ]}
        stats={[
          { label: 'Événements actifs', value: '05' },
          { label: 'Billets vendus', value: '1 240' },
          { label: 'Taux de remplissage', value: '74%' },
        ]}
      />
      <DashboardSummaryClient role="ORGANIZER" userId={sessionUser.userId} />
      <OrganisateurCrudClient userId={sessionUser.userId} />
    </main>
  );
}
