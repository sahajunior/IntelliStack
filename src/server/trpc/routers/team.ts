import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  assertCanManageMember,
  organizationRoles,
} from "@/server/team/policy";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/trpc/init";

function safeClerkError(error: unknown, fallback: string): never {
  console.error(fallback, error);
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: fallback,
  });
}

function serializeMember(
  membership: Awaited<
    ReturnType<
      Awaited<ReturnType<typeof clerkClient>>["organizations"]["getOrganizationMembershipList"]
    >
  >["data"][number],
) {
  const user = membership.publicUserData;
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.identifier ||
    "Organization member";

  return {
    id: membership.id,
    userId: user?.userId ?? "",
    name,
    email: user?.identifier ?? "Email unavailable",
    imageUrl: user?.imageUrl ?? null,
    role: membership.role,
    joinedAt: new Date(membership.createdAt).toISOString(),
  };
}

function serializeInvitation(
  invitation: Awaited<
    ReturnType<
      Awaited<ReturnType<typeof clerkClient>>["organizations"]["getOrganizationInvitationList"]
    >
  >["data"][number],
) {
  return {
    id: invitation.id,
    email: invitation.emailAddress,
    role: invitation.role,
    status: invitation.status ?? "pending",
    createdAt: new Date(invitation.createdAt).toISOString(),
    expiresAt: new Date(invitation.expiresAt).toISOString(),
  };
}

const roleSchema = z.enum(organizationRoles);

export const teamRouter = createTRPCRouter({
  getMembers: protectedProcedure.query(async ({ ctx }) => {
    const client = await clerkClient();
    const response =
      await client.organizations.getOrganizationMembershipList({
        organizationId: ctx.orgId,
        limit: 100,
        orderBy: "+created_at",
      });

    return {
      members: response.data.map(serializeMember),
      totalCount: response.totalCount,
      currentUserId: ctx.userId,
    };
  }),

  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        role: roleSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertCanManageMember(ctx.userId, input.userId);

      try {
        const client = await clerkClient();
        const membership =
          await client.organizations.updateOrganizationMembership({
            organizationId: ctx.orgId,
            userId: input.userId,
            role: input.role,
          });

        return serializeMember(membership);
      } catch (error) {
        return safeClerkError(error, "The member role could not be updated.");
      }
    }),

  removeMember: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      assertCanManageMember(ctx.userId, input.userId);

      try {
        const client = await clerkClient();
        await client.organizations.deleteOrganizationMembership({
          organizationId: ctx.orgId,
          userId: input.userId,
        });

        return { userId: input.userId };
      } catch (error) {
        return safeClerkError(error, "The member could not be removed.");
      }
    }),

  getPendingInvitations: protectedProcedure.query(async ({ ctx }) => {
    const client = await clerkClient();
    const response =
      await client.organizations.getOrganizationInvitationList({
        organizationId: ctx.orgId,
        status: ["pending"],
        limit: 100,
      });

    return {
      invitations: response.data.map(serializeInvitation),
      totalCount: response.totalCount,
    };
  }),

  createInvitation: adminProcedure
    .input(
      z.object({
        email: z.string().trim().email().max(254),
        role: roleSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const client = await clerkClient();
        const invitation =
          await client.organizations.createOrganizationInvitation({
            organizationId: ctx.orgId,
            inviterUserId: ctx.userId,
            emailAddress: input.email.toLowerCase(),
            role: input.role,
            redirectUrl: process.env.NEXT_PUBLIC_APP_URL
              ? `${process.env.NEXT_PUBLIC_APP_URL}/team`
              : undefined,
          });

        return serializeInvitation(invitation);
      } catch (error) {
        return safeClerkError(error, "The invitation could not be sent.");
      }
    }),

  cancelInvitation: adminProcedure
    .input(z.object({ invitationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const client = await clerkClient();
        await client.organizations.revokeOrganizationInvitation({
          organizationId: ctx.orgId,
          invitationId: input.invitationId,
          requestingUserId: ctx.userId,
        });

        return { invitationId: input.invitationId };
      } catch (error) {
        return safeClerkError(error, "The invitation could not be canceled.");
      }
    }),
});
