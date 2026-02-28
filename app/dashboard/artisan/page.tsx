import { redirect } from 'next/navigation';
import { getRoleDashboardPath, getSessionUser } from '@/lib/session';
import DashboardSummaryClient from '@/app/dashboard/_components/dashboard-summary-client';
import ArtisanCrudClient from '@/app/dashboard/_components/artisan-crud-client';
import DashboardRoleHero from '@/app/dashboard/_components/dashboard-role-hero';

export default async function ArtisanDashboardPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect('/login');
  }

  if (sessionUser.role !== 'ARTISAN') {
    redirect(getRoleDashboardPath(sessionUser.role));
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <DashboardRoleHero
        title="Dashboard Artisan"
        subtitle="Pilotez vos produits, commandes et certificats dans une interface orientée business."
        actions={[
          { label: 'Ajouter un produit', href: '/dashboard/artisan' },
          { label: 'Suivre commandes', href: '/dashboard/artisan' },
        ]}
        stats={[
          { label: 'Produits actifs', value: '12' },
          { label: 'Commandes ce mois', value: '18' },
          { label: 'Certificats émis', value: '09' },
        ]}
      />
      <DashboardSummaryClient role="ARTISAN" userId={sessionUser.userId} />
      <ArtisanCrudClient userId={sessionUser.userId} />
    </main>
  );
}
