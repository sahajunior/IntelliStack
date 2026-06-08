import { currentUser } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import {
  activityTypes,
  privateOrgChannel,
  type ActivityEvent,
} from "@/lib/activity";
import { activityEvents } from "@/server/db/schema";
import { getPusherServer } from "@/server/pusher";
import {
  createTRPCRouter,
  protectedProcedure,
  writeProcedure,
} from "@/server/trpc/init";

const activityPayloadSchema = z.object({
  actorName: z.string().min(1).max(100),
  message: z.string().min(1).max(240),
});

function serializeActivityEvent(row: {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  createdAt: Date;
}): ActivityEvent {
  const payload = activityPayloadSchema.safeParse(row.payload);

  return {
    id: row.id,
    type: activityTypes.includes(row.type as ActivityEvent["type"])
      ? (row.type as ActivityEvent["type"])
      : "report_generated",
    actorName: payload.success ? payload.data.actorName : "Workspace member",
    message: payload.success ? payload.data.message : "Updated the workspace",
    createdAt: row.createdAt.toISOString(),
  };
}

export const activityRouter = createTRPCRouter({
  getRecentEvents: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: activityEvents.id,
        type: activityEvents.type,
        payload: activityEvents.payload,
        createdAt: activityEvents.createdAt,
      })
      .from(activityEvents)
      .where(eq(activityEvents.orgId, ctx.orgId))
      .orderBy(desc(activityEvents.createdAt))
      .limit(20);

    return rows.map(serializeActivityEvent);
  }),

  createActivityEvent: writeProcedure
    .input(
      z.object({
        type: z.enum(activityTypes).default("report_generated"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await currentUser();
      const actorName =
        user?.fullName ??
        user?.primaryEmailAddress?.emailAddress ??
        "Workspace member";
      const messages: Record<(typeof activityTypes)[number], string> = {
        user_joined: "joined the organization",
        plan_upgraded: "upgraded the workspace plan",
        session_started: "started a new analytics session",
        report_generated: "generated a dashboard report",
      };
      const pusher = getPusherServer();

      const [row] = await ctx.db
        .insert(activityEvents)
        .values({
          orgId: ctx.orgId,
          type: input.type,
          payload: {
            actorName,
            message: messages[input.type],
          },
        })
        .returning({
          id: activityEvents.id,
          type: activityEvents.type,
          payload: activityEvents.payload,
          createdAt: activityEvents.createdAt,
        });

      if (!row) {
        throw new Error("The activity event could not be created.");
      }

      const event = serializeActivityEvent(row);

      await pusher.trigger(privateOrgChannel(ctx.orgId), "new-event", event);

      return event;
    }),
});
