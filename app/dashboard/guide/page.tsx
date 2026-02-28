import { redirect } from 'next/navigation';
import { getRoleDashboardPath, getSessionUser } from '@/lib/session';
import DashboardSummaryClient from '@/app/dashboard/_components/dashboard-summary-client';
import GuideCrudClient from '@/app/dashboard/_components/guide-crud-client';
import DashboardRoleHero from '@/app/dashboard/_components/dashboard-role-hero';

export default async function GuideDashboardPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect('/login');
  }

  if (sessionUser.role !== 'GUIDE') {
    redirect(getRoleDashboardPath(sessionUser.role));
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <DashboardRoleHero
        title="Dashboard Guide"
        subtitle="Gérez vos disponibilités, vos circuits et vos demandes clients efficacement."
        actions={[
          { label: 'Mettre à jour agenda', href: '/dashboard/guide' },
          { label: 'Voir demandes', href: '/dashboard/guide' },
        ]}
        stats={[
          { label: 'Circuits actifs', value: '06' },
          { label: 'Demandes en attente', value: '04' },
          { label: 'Note moyenne', value: '4.8/5' },
        ]}
      />
      <DashboardSummaryClient role="GUIDE" userId={sessionUser.userId} />
      <GuideCrudClient userId={sessionUser.userId} />
    </main>
  );
}
