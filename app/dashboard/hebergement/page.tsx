import { redirect } from 'next/navigation';
import { getRoleDashboardPath, getSessionUser } from '@/lib/session';
import DashboardSummaryClient from '@/app/dashboard/_components/dashboard-summary-client';
import DashboardRoleHero from '@/app/dashboard/_components/dashboard-role-hero';
import HebergementCrudClient from '@/app/dashboard/_components/hebergement-crud-client';

export default async function HebergementDashboardPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect('/login');
  }

  if (sessionUser.role !== 'ACCOMMODATION_COMPANY') {
    redirect(getRoleDashboardPath(sessionUser.role));
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <DashboardRoleHero
        title="Dashboard Entreprise Hébergement"
        subtitle="Authentifiez votre entreprise et gérez votre catalogue d’hébergements avec un CRUD complet."
        actions={[
          { label: 'Ajouter un hébergement', href: '/dashboard/hebergement' },
          {
            label: 'Voir mon catalogue',
            href: '/dashboard/hebergement/mes-hebergements',
          },
        ]}
        stats={[
          { label: 'Hébergements actifs', value: '—' },
          { label: 'Demandes en cours', value: '—' },
          { label: 'Taux dispo', value: '—' },
        ]}
      />

      <DashboardSummaryClient
        role="ACCOMMODATION_COMPANY"
        userId={sessionUser.userId}
      />
      <HebergementCrudClient userId={sessionUser.userId} />
    </main>
  );
}
