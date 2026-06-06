"use client";

import { useEffect, useState } from "react";

import { presenceOrgChannel } from "@/lib/activity";
import {
  getPusherClient,
  isPusherClientConfigured,
} from "@/lib/pusher-client";

type PresenceMembers = {
  count: number;
};

export function LivePresenceBadge({ orgId }: Readonly<{ orgId: string }>) {
  const configured = isPusherClientConfigured();
  const [count, setCount] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!configured) {
      return;
    }

    const pusher = getPusherClient();
    const channelName = presenceOrgChannel(orgId);
    const channel = pusher.subscribe(channelName);
    const updateMembers = (members?: PresenceMembers) => {
      const presenceChannel = channel as typeof channel & {
        members?: PresenceMembers;
      };
      setCount(members?.count ?? presenceChannel.members?.count ?? 0);
      setConnected(true);
    };
    const reset = () => {
      setConnected(false);
      setCount(0);
    };

    channel.bind("pusher:subscription_succeeded", updateMembers);
    channel.bind("pusher:member_added", () => updateMembers());
    channel.bind("pusher:member_removed", () => updateMembers());
    channel.bind("pusher:subscription_error", reset);

    return () => {
      channel.unbind("pusher:subscription_succeeded", updateMembers);
      channel.unbind("pusher:member_added");
      channel.unbind("pusher:member_removed");
      channel.unbind("pusher:subscription_error", reset);
      pusher.unsubscribe(channelName);
    };
  }, [configured, orgId]);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
        connected
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
      title={
        configured
          ? "Members currently connected to this organization"
          : "Pusher is not configured"
      }
    >
      <span
        className={`size-2 rounded-full ${
          connected ? "bg-emerald-500" : "bg-slate-300"
        }`}
      />
      {connected ? `${count} online` : "Realtime offline"}
    </span>
  );
}
