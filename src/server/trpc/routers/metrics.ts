import { and, asc, desc, eq, gte } from "drizzle-orm";

import { metrics } from "@/server/db/schema";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/trpc/init";

function dateDaysAgo(days: number) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

function percentChange(current: number, previous: number | undefined) {
  if (previous === undefined) {
    return null;
  }

  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

export const metricsRouter = createTRPCRouter({
  getLast30Days: protectedProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        date: metrics.date,
        mrr: metrics.mrr,
        newUsers: metrics.newUsers,
        activeSessions: metrics.activeSessions,
        churnRate: metrics.churnRate,
      })
      .from(metrics)
      .where(
        and(
          eq(metrics.orgId, ctx.orgId),
          gte(metrics.date, dateDaysAgo(29)),
        ),
      )
      .orderBy(asc(metrics.date)),
  ),

  getKPISummary: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        date: metrics.date,
        mrr: metrics.mrr,
        newUsers: metrics.newUsers,
        activeSessions: metrics.activeSessions,
        churnRate: metrics.churnRate,
      })
      .from(metrics)
      .where(eq(metrics.orgId, ctx.orgId))
      .orderBy(desc(metrics.date))
      .limit(8);

    const latest = rows[0];

    if (!latest) {
      return null;
    }

    const comparison = rows[7];

    return {
      ...latest,
      changes: {
        mrr: percentChange(latest.mrr, comparison?.mrr),
        newUsers: percentChange(latest.newUsers, comparison?.newUsers),
        activeSessions: percentChange(
          latest.activeSessions,
          comparison?.activeSessions,
        ),
        churnRate: percentChange(latest.churnRate, comparison?.churnRate),
      },
    };
  }),
});
