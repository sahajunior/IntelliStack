import { auth } from "@clerk/nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { assertOrganizationAdmin } from "@/server/team/policy";
import { db } from "@/server/db";

export async function createTRPCContext() {
  const { userId, orgId, has } = await auth();

  if (!userId || !orgId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "An authenticated user and active organization are required.",
    });
  }

  return {
    db,
    userId,
    orgId,
    isOrgAdmin: has({ role: "org:admin" }),
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const protectedProcedure = t.procedure;
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  assertOrganizationAdmin(ctx.isOrgAdmin);

  return next({ ctx });
});
