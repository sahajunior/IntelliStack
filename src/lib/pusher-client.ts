"use client";

import Pusher from "pusher-js";

let pusher: Pusher | undefined;

export function isPusherClientConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY &&
      process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  );
}

export function getPusherClient() {
  const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    throw new Error("Pusher browser credentials are not configured");
  }

  if (!pusher) {
    pusher = new Pusher(key, {
      cluster,
      channelAuthorization: {
        endpoint: "/api/pusher/auth",
        transport: "ajax",
      },
    });
  }

  return pusher;
}
