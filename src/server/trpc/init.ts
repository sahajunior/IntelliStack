import { auth, currentUser } from "@clerk/nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { db } from "@/server/db";
import { assertNotDemoUser, getDemoEmail, getDemoUserId, isDemoUser } from "@/server/demo";
import { assertOrganizationAdmin } from "@/server/team/policy";

export async function createTRPCContext() {
  const { userId, orgId, has } = await auth();

  if (!userId || !orgId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "An authenticated user and active organization are required.",
    });
  }

  const demoConfigured = Boolean(getDemoUserId() || getDemoEmail());
  const user = demoConfigured ? await currentUser() : null;

  return {
    db,
    userId,
    orgId,
    isDemoUser: isDemoUser(user),
    isOrgAdmin: has({ role: "org:admin" }),
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const protectedProcedure = t.procedure;
export const writeProcedure = protectedProcedure.use(({ ctx, next }) => {
  assertNotDemoUser(ctx.isDemoUser);

  return next({ ctx });
});
export const adminProcedure = writeProcedure.use(({ ctx, next }) => {
  assertOrganizationAdmin(ctx.isOrgAdmin);

  return next({ ctx });
});
