import { TRPCError } from "@trpc/server";

export const organizationRoles = ["org:admin", "org:member"] as const;

export type OrganizationRole = (typeof organizationRoles)[number];

export function assertOrganizationAdmin(isOrgAdmin: boolean) {
  if (!isOrgAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization administrator access is required.",
    });
  }
}

export function assertCanManageMember(
  requestingUserId: string,
  targetUserId: string,
) {
  if (requestingUserId === targetUserId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Manage your own membership through another organization admin.",
    });
  }
}
