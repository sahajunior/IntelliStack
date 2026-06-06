import { getTrustedChatHistory } from "@/server/chat/messages";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/trpc/init";

export const chatRouter = createTRPCRouter({
  getHistory: protectedProcedure.query(({ ctx }) =>
    getTrustedChatHistory(ctx.orgId, ctx.userId, 50),
  ),
});
