import { auth, currentUser } from "@clerk/nextjs/server";

import {
  presenceOrgChannel,
  privateOrgChannel,
} from "@/lib/activity";
import { getPusherServer } from "@/server/pusher";

export async function POST(request: Request) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return new Response("Forbidden", { status: 403 });
  }

  const formData = await request.formData();
  const socketId = formData.get("socket_id");
  const channelName = formData.get("channel_name");

  if (typeof socketId !== "string" || typeof channelName !== "string") {
    return new Response("Invalid authorization request", { status: 400 });
  }

  const allowedChannels = new Set([
    privateOrgChannel(orgId),
    presenceOrgChannel(orgId),
  ]);

  if (!allowedChannels.has(channelName)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    if (channelName.startsWith("presence-")) {
      const user = await currentUser();
      const displayName =
        user?.fullName ??
        user?.primaryEmailAddress?.emailAddress ??
        "Workspace member";

      return Response.json(
        getPusherServer().authorizeChannel(socketId, channelName, {
          user_id: userId,
          user_info: {
            name: displayName,
            imageUrl: user?.imageUrl,
          },
        }),
      );
    }

    return Response.json(
      getPusherServer().authorizeChannel(socketId, channelName),
    );
  } catch (error) {
    console.error("Pusher channel authorization failed", error);
    return new Response("Real-time service is not configured", {
      status: 503,
    });
  }
}
