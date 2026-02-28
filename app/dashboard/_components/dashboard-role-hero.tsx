import Link from 'next/link';

type HeroAction = {
  label: string;
  href: string;
};

type HeroStat = {
  label: string;
  value: string;
};

type DashboardRoleHeroProps = {
  title: string;
  subtitle: string;
  actions: HeroAction[];
  stats: HeroStat[];
};

export default function DashboardRoleHero({
  title,
  subtitle,
  actions,
  stats,
}: DashboardRoleHeroProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={`${action.label}-${action.href}`}
              href={action.href}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-zinc-800"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-xl border border-black/10 bg-zinc-50 p-4 dark:border-white/15 dark:bg-zinc-950"
          >
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {stat.label}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
