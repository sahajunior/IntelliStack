"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenuePoint = {
  date: string;
  mrr: number;
};

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatDollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function RevenueChart({ data }: Readonly<{ data: RevenuePoint[] }>) {
  const first = data.at(0);
  const latest = data.at(-1);
  const growth =
    first && latest && first.mrr > 0
      ? ((latest.mrr - first.mrr) / first.mrr) * 100
      : 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-3">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Revenue trend</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            MRR over 30 days
          </h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          +{growth.toFixed(1)}% this period
        </span>
      </div>

      <div className="h-72 min-w-0" aria-hidden="true">
        <ResponsiveContainer
          height="100%"
          initialDimension={{ width: 720, height: 288 }}
          minWidth={0}
          width="100%"
        >
          <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              minTickGap={36}
              tickFormatter={formatShortDate}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickFormatter={(value: number) => `$${Math.round(value / 100_000)}k`}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => [formatDollars(Number(value)), "MRR"]}
              labelFormatter={(value) => formatShortDate(String(value))}
              contentStyle={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
              }}
            />
            <Line
              dataKey="mrr"
              dot={false}
              stroke="#4f46e5"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>Monthly recurring revenue by date</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>MRR</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.date}>
              <td>{point.date}</td>
              <td>{formatDollars(point.mrr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
