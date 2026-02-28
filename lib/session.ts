import { cookies } from 'next/headers';
import { getDashboardPathByRole, verifyAccessToken } from '@/lib/auth';

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return null;
  }

  return verifyAccessToken(token);
}

export function getRoleDashboardPath(role: string) {
  return getDashboardPathByRole(role);
}
