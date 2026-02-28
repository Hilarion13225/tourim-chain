import { redirect } from 'next/navigation';
import { getRoleDashboardPath, getSessionUser } from '@/lib/session';
import DashboardRoleHero from '@/app/dashboard/_components/dashboard-role-hero';
import HebergementListClient from '@/app/dashboard/_components/hebergement-list-client';

export default async function MesHebergementsPage() {
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
        title="Mes hébergements"
        subtitle="Consultez la liste complète des hébergements publiés par votre entreprise."
        actions={[
          { label: 'Dashboard hébergement', href: '/dashboard/hebergement' },
          { label: 'Ajouter un hébergement', href: '/dashboard/hebergement' },
        ]}
        stats={[
          { label: 'Total hébergements', value: '—' },
          { label: 'Actifs', value: '—' },
          { label: 'Inactifs', value: '—' },
        ]}
      />

      <HebergementListClient userId={sessionUser.userId} />
    </main>
  );
}
