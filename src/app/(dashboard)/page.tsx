import { auth, currentUser } from "@clerk/nextjs/server";

import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { isDemoUser } from "@/server/demo";

export default async function DashboardPage() {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("An active organization is required.");
  }

  const user = await currentUser();
  const demoMode = isDemoUser(user);

  return (
    <section>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Overview</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Live metrics are loaded through tenant-scoped tRPC procedures backed
            by Neon PostgreSQL.
          </p>
        </div>
        <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          Updated daily
        </span>
      </div>

      <DashboardMetrics isDemoUser={demoMode} orgId={orgId} />

      <p className="mt-6 text-center text-xs text-slate-400">
        Tenant scope: <code>{orgId}</code>
      </p>
    </section>
  );
}
