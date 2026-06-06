"use client";

import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { SignupsChart } from "@/components/dashboard/signups-chart";
import { trpc } from "@/trpc/client";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function ChangeLabel({
  value,
  inverse = false,
}: Readonly<{ value: number | null; inverse?: boolean }>) {
  if (value === null) {
    return <span className="text-slate-400">No 7-day comparison</span>;
  }

  const rising = value >= 0;
  const favorable = inverse ? !rising : rising;

  return (
    <span className={favorable ? "text-emerald-600" : "text-rose-600"}>
      {rising ? "↑" : "↓"} {Math.abs(value)}% vs. 7 days ago
    </span>
  );
}

export function DashboardMetrics({ orgId }: Readonly<{ orgId: string }>) {
  const summary = trpc.metrics.getKPISummary.useQuery();
  const history = trpc.metrics.getLast30Days.useQuery();

  if (summary.isPending || history.isPending) {
    return <DashboardSkeleton />;
  }

  const error = summary.error ?? history.error;
  const historyData = history.data ?? [];

  if (error) {
    return (
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        <span>Metrics could not be loaded: {error.message}</span>
        <button
          className="rounded-lg border border-rose-300 bg-white px-3 py-2 font-semibold transition hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          onClick={() => {
            void summary.refetch();
            void history.refetch();
          }}
          type="button"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!summary.data || historyData.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        No metrics exist for this organization yet. Run the seed command with
        this organization&apos;s Clerk ID.
      </div>
    );
  }

  const cards = [
    {
      label: "New users",
      value: summary.data.newUsers.toLocaleString(),
      change: summary.data.changes.newUsers,
      inverse: false,
    },
    {
      label: "Monthly revenue",
      value: formatCurrency(summary.data.mrr),
      change: summary.data.changes.mrr,
      inverse: false,
    },
    {
      label: "Active sessions",
      value: summary.data.activeSessions.toLocaleString(),
      change: summary.data.changes.activeSessions,
      inverse: false,
    },
    {
      label: "Churn rate",
      value: `${summary.data.churnRate.toFixed(1)}%`,
      change: summary.data.changes.churnRate,
      inverse: true,
    },
  ];

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {card.value}
            </p>
            <p className="mt-2 text-xs">
              <ChangeLabel inverse={card.inverse} value={card.change} />
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <RevenueChart data={historyData} />
        <SignupsChart data={historyData} />
      </div>

      <ActivityFeed orgId={orgId} />
    </div>
  );
}
