import assert from "node:assert/strict";
import test from "node:test";

import { TRPCError } from "@trpc/server";

import {
  assertCanManageMember,
  assertOrganizationAdmin,
  organizationRoles,
} from "@/server/team/policy";

test("team mutations require organization admin authorization", () => {
  assert.doesNotThrow(() => assertOrganizationAdmin(true));
  assert.throws(
    () => assertOrganizationAdmin(false),
    (error) => error instanceof TRPCError && error.code === "FORBIDDEN",
  );
});

test("admins cannot mutate their own organization membership", () => {
  assert.doesNotThrow(() => assertCanManageMember("user_admin", "user_member"));
  assert.throws(
    () => assertCanManageMember("user_admin", "user_admin"),
    (error) => error instanceof TRPCError && error.code === "BAD_REQUEST",
  );
});

test("team roles are restricted to Clerk's default organization roles", () => {
  assert.deepEqual(organizationRoles, ["org:admin", "org:member"]);
});
