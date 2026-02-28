import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import { getRoleDashboardPath, getSessionUser } from '@/lib/session';
import MainNavTabs from './_components/main-nav-tabs';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'tourisme Ci • Côte d’Ivoire',
  description:
    'Plateforme touristique multi-acteurs dédiée à la Côte d’Ivoire pour découvrir, réserver et valoriser la culture ivoirienne.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionUser = await getSessionUser();

  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-white/15 dark:bg-zinc-950/95">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
            <Link href="/" className="flex items-center gap-3">
              <div>
                <p className="text-3xl font-extrabold leading-none tracking-tight text-zinc-900 dark:text-white">
                  <span>tourisme</span>
                  <span className="ml-1 text-orange-500">Ci</span>
                  <span className="ml-2 text-xl font-semibold text-zinc-500 dark:text-zinc-400">
                    séjours
                  </span>
                </p>
              </div>
            </Link>

            <MainNavTabs />

            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="tel:112"
                className="rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Alerte urgence
              </Link>
              <Link
                href={
                  sessionUser
                    ? getRoleDashboardPath(sessionUser.role)
                    : '/login'
                }
                className="rounded-2xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
              >
                {sessionUser ? 'Mon dashboard' : 'Connexion'}
              </Link>
              <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 text-xs font-semibold dark:bg-white/10">
                <span className="rounded-md bg-orange-100 px-2 py-1 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300">
                  FR
                </span>
                <span className="rounded-md px-2 py-1 text-zinc-500 dark:text-zinc-300">
                  EN
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <Link
                href="tel:112"
                className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white"
              >
                Urgence
              </Link>
              <Link
                href={
                  sessionUser
                    ? getRoleDashboardPath(sessionUser.role)
                    : '/login'
                }
                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
              >
                {sessionUser ? 'Dashboard' : 'Login'}
              </Link>
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
