import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { normalizeOptionalUrl } from "@/lib/settings";
import { orgSettings } from "@/server/db/schema";
import { assertOrganizationDeleteConfirmation } from "@/server/settings/policy";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/trpc/init";

function throwSettingsError(error: unknown, message: string): never {
  console.error(message, error);
  throw new TRPCError({
    code: "BAD_REQUEST",
    message,
  });
}

export const settingsRouter = createTRPCRouter({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const client = await clerkClient();
    const [organization, user, stored] = await Promise.all([
      client.organizations.getOrganization({
        organizationId: ctx.orgId,
      }),
      currentUser(),
      ctx.db.query.orgSettings.findFirst({
        where: eq(orgSettings.orgId, ctx.orgId),
      }),
    ]);

    return {
      orgId: ctx.orgId,
      organization: {
        name: stored?.displayName ?? organization.name,
        clerkName: organization.name,
        logoUrl: stored?.logoUrl ?? organization.imageUrl ?? "",
      },
      personal: {
        displayName:
          user?.fullName ??
          user?.primaryEmailAddress?.emailAddress ??
          "Workspace member",
        notificationsEnabled: stored?.notificationsEnabled ?? true,
      },
      isOrgAdmin: ctx.isOrgAdmin,
    };
  }),

  updateOrganization: adminProcedure
    .input(
      z.object({
        displayName: z.string().trim().min(1).max(100),
        logoUrl: z.union([z.string().trim().url().max(2_048), z.literal("")]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const logoUrl = normalizeOptionalUrl(input.logoUrl);

      try {
        const client = await clerkClient();
        await client.organizations.updateOrganization(ctx.orgId, {
          name: input.displayName,
        });

        const [settings] = await ctx.db
          .insert(orgSettings)
          .values({
            orgId: ctx.orgId,
            displayName: input.displayName,
            logoUrl,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: orgSettings.orgId,
            set: {
              displayName: input.displayName,
              logoUrl,
              updatedAt: new Date(),
            },
          })
          .returning({
            displayName: orgSettings.displayName,
            logoUrl: orgSettings.logoUrl,
          });

        return {
          displayName: settings?.displayName ?? input.displayName,
          logoUrl: settings?.logoUrl ?? "",
        };
      } catch (error) {
        return throwSettingsError(
          error,
          "Organization settings could not be saved.",
        );
      }
    }),

  updateNotifications: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [settings] = await ctx.db
        .insert(orgSettings)
        .values({
          orgId: ctx.orgId,
          notificationsEnabled: input.enabled,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: orgSettings.orgId,
          set: {
            notificationsEnabled: input.enabled,
            updatedAt: new Date(),
          },
        })
        .returning({
          notificationsEnabled: orgSettings.notificationsEnabled,
        });

      return settings?.notificationsEnabled ?? input.enabled;
    }),

  deleteOrganization: adminProcedure
    .input(z.object({ confirmation: z.string().max(100) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const client = await clerkClient();
        const organization = await client.organizations.getOrganization({
          organizationId: ctx.orgId,
        });

        assertOrganizationDeleteConfirmation(
          organization.name,
          input.confirmation,
        );

        await client.organizations.deleteOrganization(ctx.orgId);

        return { deleted: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        return throwSettingsError(error, "The organization could not be deleted.");
      }
    }),
});
