"use client";

import { useEffect, useMemo, useState } from "react";

import {
  privateOrgChannel,
  type ActivityEvent,
  type ActivityType,
} from "@/lib/activity";
import {
  getPusherClient,
  isPusherClientConfigured,
} from "@/lib/pusher-client";
import { trpc } from "@/trpc/client";

const eventStyles: Record<
  ActivityType,
  { label: string; className: string; path: string }
> = {
  user_joined: {
    label: "Member",
    className: "bg-sky-100 text-sky-700",
    path: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0M19 8v6m3-3h-6",
  },
  plan_upgraded: {
    label: "Plan",
    className: "bg-violet-100 text-violet-700",
    path: "m12 3 2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2-3.8-3.7 5.2-.8L12 3Z",
  },
  session_started: {
    label: "Session",
    className: "bg-emerald-100 text-emerald-700",
    path: "M5 12h14M12 5l7 7-7 7",
  },
  report_generated: {
    label: "Report",
    className: "bg-amber-100 text-amber-700",
    path: "M7 3h7l4 4v14H7V3Zm7 0v5h5M10 13h5m-5 4h5",
  },
};

function eventTime(value: string) {
  const date = new Date(value);
  const elapsedSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(elapsedSeconds) < 60) {
    return formatter.format(elapsedSeconds, "second");
  }

  const elapsedMinutes = Math.round(elapsedSeconds / 60);

  if (Math.abs(elapsedMinutes) < 60) {
    return formatter.format(elapsedMinutes, "minute");
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);

  if (Math.abs(elapsedHours) < 24) {
    return formatter.format(elapsedHours, "hour");
  }

  return formatter.format(Math.round(elapsedHours / 24), "day");
}

function mergeEvent(events: ActivityEvent[], event: ActivityEvent) {
  return [event, ...events.filter((item) => item.id !== event.id)].slice(0, 20);
}

export function ActivityFeed({ orgId }: Readonly<{ orgId: string }>) {
  const configured = isPusherClientConfigured();
  const query = trpc.activity.getRecentEvents.useQuery();
  const [liveEvents, setLiveEvents] = useState<ActivityEvent[]>([]);
  const [connectionState, setConnectionState] = useState<
    "connecting" | "connected" | "unavailable"
  >(configured ? "connecting" : "unavailable");
  const [clock, setClock] = useState(0);

  const eventTypes = useMemo(
    () =>
      [
        "report_generated",
        "session_started",
        "plan_upgraded",
        "user_joined",
      ] as const,
    [],
  );
  const mutation = trpc.activity.createActivityEvent.useMutation({
    onSuccess: (event) => {
      setLiveEvents((current) => mergeEvent(current, event));
    },
  });
  const events = useMemo(() => {
    const eventsById = new Map<string, ActivityEvent>();

    for (const event of [...liveEvents, ...(query.data ?? [])]) {
      eventsById.set(event.id, event);
    }

    return [...eventsById.values()]
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      )
      .slice(0, 20);
  }, [liveEvents, query.data]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock((value) => value + 1);
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!configured) {
      return;
    }

    const pusher = getPusherClient();
    const channelName = privateOrgChannel(orgId);
    const channel = pusher.subscribe(channelName);
    const handleConnection = () => setConnectionState("connected");
    const handleUnavailable = () => setConnectionState("unavailable");
    const handleEvent = (event: ActivityEvent) => {
      setLiveEvents((current) => mergeEvent(current, event));
    };

    pusher.connection.bind("connected", handleConnection);
    pusher.connection.bind("unavailable", handleUnavailable);
    pusher.connection.bind("failed", handleUnavailable);
    channel.bind("new-event", handleEvent);

    if (pusher.connection.state === "connected") {
      queueMicrotask(handleConnection);
    }

    return () => {
      channel.unbind("new-event", handleEvent);
      pusher.connection.unbind("connected", handleConnection);
      pusher.connection.unbind("unavailable", handleUnavailable);
      pusher.connection.unbind("failed", handleUnavailable);
      pusher.unsubscribe(channelName);
    };
  }, [configured, orgId]);

  const createTestEvent = () => {
    const type = eventTypes[events.length % eventTypes.length];
    mutation.mutate({ type });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-500">
              Recent activity
            </p>
            <span
              className={`size-2 rounded-full ${
                connectionState === "connected"
                  ? "bg-emerald-500"
                  : connectionState === "connecting"
                    ? "animate-pulse bg-amber-400"
                    : "bg-slate-300"
              }`}
              title={`Real-time connection: ${connectionState}`}
            />
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            Workspace events
          </h2>
        </div>
        <button
          className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          disabled={!configured || mutation.isPending}
          onClick={createTestEvent}
          type="button"
        >
          {mutation.isPending ? "Sending…" : "Send test event"}
        </button>
      </div>

      {!configured ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Add the Pusher variables from <code>.env.example</code> to{" "}
          <code>.env.local</code>, then restart the development server.
        </div>
      ) : null}

      {query.isPending ? (
        <div className="mt-5 space-y-3" aria-label="Loading activity">
          {[0, 1, 2].map((item) => (
            <div
              className="h-16 animate-pulse rounded-xl bg-slate-100"
              key={item}
            />
          ))}
        </div>
      ) : null}

      {query.error ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <span>Activity could not be loaded: {query.error.message}</span>
          <button
            className="font-semibold underline underline-offset-4"
            onClick={() => void query.refetch()}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!query.isPending && !query.error && events.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-9 text-center">
          <p className="font-medium text-slate-700">No workspace events yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Send a test event to verify delivery across multiple browser tabs.
          </p>
        </div>
      ) : null}

      {events.length > 0 ? (
        <ol className="mt-5 divide-y divide-slate-100">
          {events.map((event) => {
            const style = eventStyles[event.type];

            return (
              <li className="flex gap-3 py-4 first:pt-0 last:pb-0" key={event.id}>
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${style.className}`}
                  title={style.label}
                >
                  <svg
                    aria-hidden="true"
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path d={style.path} />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">
                      {event.actorName}
                    </span>{" "}
                    {event.message}
                  </p>
                  <time
                    className="mt-1 block text-xs text-slate-400"
                    data-refresh-tick={clock}
                    dateTime={event.createdAt}
                    title={new Date(event.createdAt).toLocaleString()}
                  >
                    {eventTime(event.createdAt)}
                  </time>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}

      {mutation.error ? (
        <p className="mt-4 text-sm text-rose-600">
          Test event failed: {mutation.error.message}
        </p>
      ) : null}
    </section>
  );
}
