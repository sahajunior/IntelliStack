import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { metrics } from "../src/server/db/schema";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
const orgId =
  process.argv.find((argument) => argument.startsWith("--org-id="))?.split(
    "=",
    2,
  )[1] ?? process.env.SEED_ORG_ID;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required in .env.local");
}

if (!orgId) {
  throw new Error(
    "Provide a Clerk organization ID with --org-id=org_... or SEED_ORG_ID.",
  );
}

const resolvedDatabaseUrl = databaseUrl;
const resolvedOrgId = orgId;

function dateDaysAgo(days: number) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

async function main() {
  const db = drizzle(resolvedDatabaseUrl);
  const rows = Array.from({ length: 30 }, (_, index) => {
    const daysAgo = 29 - index;
    const trend = index * 13;

    return {
      orgId: resolvedOrgId,
      date: dateDaysAgo(daysAgo),
      mrr: 425_000 + trend * 100 + (index % 5) * 2_500,
      newUsers: 18 + Math.floor(index / 3) + (index % 4),
      activeSessions: 340 + trend + (index % 6) * 11,
      churnRate: Number(Math.max(1.8, 4.7 - index * 0.07).toFixed(2)),
    };
  });

  await db
    .insert(metrics)
    .values(rows)
    .onConflictDoUpdate({
      target: [metrics.orgId, metrics.date],
      set: {
        mrr: sql`excluded.mrr`,
        newUsers: sql`excluded.new_users`,
        activeSessions: sql`excluded.active_sessions`,
        churnRate: sql`excluded.churn_rate`,
      },
    });

  console.log(`Seeded 30 metric rows for organization ${resolvedOrgId}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
