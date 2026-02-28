import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/app/generated/prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const connectionString =
  process.env.DATABASE_URL ??
  (process.env.NODE_ENV !== 'production'
    ? 'postgresql://postgres:hilarion@localhost:5432/tourismhub_ci?schema=public'
    : undefined);

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in environment variables');
}

const prismaClient = (() => {
  if (connectionString.startsWith('prisma+postgres://')) {
    return new PrismaClient({
      accelerateUrl: connectionString,
    });
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
  });
})();

export const prisma = global.prisma ?? prismaClient;

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
