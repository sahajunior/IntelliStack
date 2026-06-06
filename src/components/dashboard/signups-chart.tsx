"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DailySignupPoint = {
  date: string;
  newUsers: number;
};

type WeeklySignupPoint = {
  label: string;
  range: string;
  signups: number;
};

function groupByWeek(data: DailySignupPoint[]): WeeklySignupPoint[] {
  const weeks: WeeklySignupPoint[] = [];

  for (let index = 0; index < data.length; index += 7) {
    const slice = data.slice(index, index + 7);
    const start = slice.at(0);
    const end = slice.at(-1);

    if (!start || !end) {
      continue;
    }

    const format = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });

    weeks.push({
      label: format.format(new Date(`${start.date}T00:00:00Z`)),
      range: `${format.format(
        new Date(`${start.date}T00:00:00Z`),
      )}–${format.format(new Date(`${end.date}T00:00:00Z`))}`,
      signups: slice.reduce((total, point) => total + point.newUsers, 0),
    });
  }

  return weeks;
}

export function SignupsChart({
  data,
}: Readonly<{ data: DailySignupPoint[] }>) {
  const weeklyData = groupByWeek(data);
  const total = weeklyData.reduce((sum, week) => sum + week.signups, 0);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">Acquisition</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            Weekly signups
          </h2>
          <span className="text-sm font-semibold text-indigo-600">
            {total} total
          </span>
        </div>
      </div>

      <div className="h-72 min-w-0" aria-hidden="true">
        <ResponsiveContainer
          height="100%"
          initialDimension={{ width: 480, height: 288 }}
          minWidth={0}
          width="100%"
        >
          <BarChart data={weeklyData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              interval={0}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "#eef2ff" }}
              formatter={(value) => [Number(value), "Signups"]}
              contentStyle={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
              }}
            />
            <Bar dataKey="signups" fill="#6366f1" radius={[8, 8, 2, 2]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>New user signups grouped by week</caption>
        <thead>
          <tr>
            <th>Week</th>
            <th>Signups</th>
          </tr>
        </thead>
        <tbody>
          {weeklyData.map((week) => (
            <tr key={week.label}>
              <td>{week.range}</td>
              <td>{week.signups}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
