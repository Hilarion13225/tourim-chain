import { redirect } from 'next/navigation';
import { getRoleDashboardPath, getSessionUser } from '@/lib/session';
import DashboardSummaryClient from '@/app/dashboard/_components/dashboard-summary-client';
import DashboardRoleHero from '@/app/dashboard/_components/dashboard-role-hero';
import LocationVehiculeCrudClient from '@/app/dashboard/_components/location-vehicule-crud-client';

export default async function LocationVehiculeDashboardPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect('/login');
  }

  if (sessionUser.role !== 'VEHICLE_RENTAL_COMPANY') {
    redirect(getRoleDashboardPath(sessionUser.role));
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <DashboardRoleHero
        title="Dashboard Entreprise Location Véhicule"
        subtitle="Authentifiez votre entreprise et pilotez votre flotte avec un CRUD complet de location."
        actions={[
          {
            label: 'Ajouter un véhicule',
            href: '/dashboard/location-vehicule',
          },
          {
            label: 'Voir ma flotte',
            href: '/dashboard/location-vehicule',
          },
        ]}
        stats={[
          { label: 'Véhicules disponibles', value: '—' },
          { label: 'Réservations en cours', value: '—' },
          { label: 'Taux disponibilité', value: '—' },
        ]}
      />

      <DashboardSummaryClient
        role="VEHICLE_RENTAL_COMPANY"
        userId={sessionUser.userId}
      />
      <LocationVehiculeCrudClient userId={sessionUser.userId} />
    </main>
  );
}
