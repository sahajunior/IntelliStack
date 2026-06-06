import { createTRPCRouter } from "@/server/trpc/init";
import { activityRouter } from "@/server/trpc/routers/activity";
import { chatRouter } from "@/server/trpc/routers/chat";
import { metricsRouter } from "@/server/trpc/routers/metrics";
import { settingsRouter } from "@/server/trpc/routers/settings";
import { teamRouter } from "@/server/trpc/routers/team";

export const appRouter = createTRPCRouter({
  activity: activityRouter,
  chat: chatRouter,
  metrics: metricsRouter,
  settings: settingsRouter,
  team: teamRouter,
});

export type AppRouter = typeof appRouter;
