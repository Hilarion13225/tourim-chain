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
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-white/15 dark:bg-zinc-950/95">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
            <Link href="/" className="flex items-center gap-3">
              <div>
                <p className="text-2xl font-extrabold leading-none tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
                  <span>tourisme</span>
                  <span className="ml-1 text-orange-500">Ci</span>
                  <span className="ml-2 hidden text-base font-semibold text-zinc-500 dark:text-zinc-400 sm:inline sm:text-xl">
                    séjours
                  </span>
                </p>
              </div>
            </Link>

            <MainNavTabs />

            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/urgence"
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
                href="/urgence"
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
                {sessionUser ? 'Mon dashboard' : 'Connexion'}
              </Link>
            </div>
          </div>

          <nav className="border-t border-zinc-200 px-4 py-2 md:hidden dark:border-white/10">
            <div className="mx-auto flex w-full max-w-7xl items-center gap-2 overflow-x-auto">
              {[
                { label: 'Tourisme', href: '/tourisme' },
                { label: 'Réservation', href: '/reservation' },
                { label: 'Article', href: '/article' },
                { label: 'Restauration', href: '/restauration' },
                { label: 'Sport', href: '/sport' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shrink-0 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-zinc-200 bg-white dark:border-white/15 dark:bg-zinc-950">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-4 lg:px-10">
            <div className="space-y-3 lg:col-span-2">
              <p className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                <span>tourisme</span>
                <span className="ml-1 text-orange-500">Ci</span>
              </p>
              <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
                Plateforme touristique multi-acteurs dédiée à la Côte d’Ivoire
                pour découvrir, réserver et valoriser les expériences locales.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Explorer
              </p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                <li>
                  <Link href="/tourisme" className="hover:text-orange-500">
                    Tourisme
                  </Link>
                </li>
                <li>
                  <Link href="/reservation" className="hover:text-orange-500">
                    Réservations
                  </Link>
                </li>
                <li>
                  <Link href="/sport" className="hover:text-orange-500">
                    Sport & événements
                  </Link>
                </li>
                <li>
                  <Link
                    href="/restauration"
                    className="hover:text-orange-500"
                  >
                    Restauration
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Compte
              </p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                <li>
                  <Link href="/login" className="hover:text-orange-500">
                    Connexion
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-orange-500">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/urgence" className="hover:text-orange-500">
                    Urgence
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-200 px-4 py-4 text-center text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400 sm:px-6 lg:px-10">
            © {new Date().getFullYear()} tourismeCi — Tous droits réservés.
          </div>
        </footer>
      </body>
    </html>
  );
}
