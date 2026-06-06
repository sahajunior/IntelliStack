import { TRPCError } from "@trpc/server";

export function assertOrganizationDeleteConfirmation(
  organizationName: string,
  confirmation: string,
) {
  if (confirmation !== organizationName) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The organization name confirmation does not match.",
    });
  }
}
