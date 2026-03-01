import { prisma } from '@/lib/prisma';

type TrackEventInput = {
  userId?: string | null;
  eventType: string;
  module: string;
  amount?: number;
  success?: boolean;
  metadata?: Record<string, unknown>;
};

export async function trackEvent(input: TrackEventInput) {
  try {
    await (
      prisma as unknown as {
        analyticsEvent: {
          create: (args: {
            data: {
              userId?: string;
              eventType: string;
              module: string;
              amount?: number;
              success: boolean;
              metadata?: Record<string, unknown>;
            };
          }) => Promise<unknown>;
        };
      }
    ).analyticsEvent.create({
      data: {
        ...(input.userId ? { userId: input.userId } : {}),
        eventType: input.eventType,
        module: input.module,
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        success: input.success ?? true,
        ...(input.metadata ? { metadata: input.metadata } : {}),
      },
    });
  } catch (error) {
    console.error('trackEvent', error);
  }
}
