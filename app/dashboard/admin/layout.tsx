import { redirect } from 'next/navigation';
import { getRoleDashboardPath, getSessionUser } from '@/lib/session';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect('/login');
  }

  if (sessionUser.role !== 'ADMIN') {
    redirect(getRoleDashboardPath(sessionUser.role));
  }

  return <>{children}</>;
}
