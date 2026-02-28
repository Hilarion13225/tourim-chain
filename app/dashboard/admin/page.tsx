import { redirect } from 'next/navigation';
import { getRoleDashboardPath, getSessionUser } from '@/lib/session';
import DashboardSummaryClient from '@/app/dashboard/_components/dashboard-summary-client';
import AdminCrudClient from '@/app/dashboard/_components/admin-crud-client';
import AdminNationalAnalyticsClient from '@/app/dashboard/_components/admin-national-analytics-client';
import DashboardRoleHero from '@/app/dashboard/_components/dashboard-role-hero';

export default async function AdminDashboardPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect('/login');
  }

  if (sessionUser.role !== 'ADMIN') {
    redirect(getRoleDashboardPath(sessionUser.role));
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <DashboardRoleHero
        title="Dashboard Admin"
        subtitle="Supervisez la plateforme nationale, les validations et les performances multi-acteurs."
        actions={[
          { label: 'Valider acteurs', href: '/dashboard/admin' },
          { label: 'Audit plateforme', href: '/dashboard/admin' },
        ]}
        stats={[
          { label: 'Acteurs en attente', value: '23' },
          { label: 'Transactions du mois', value: '3 450' },
          { label: 'Disponibilité', value: '99.9%' },
        ]}
      />
      <DashboardSummaryClient role="ADMIN" userId={sessionUser.userId} />
      <AdminNationalAnalyticsClient />
      <AdminCrudClient />
    </main>
  );
}
