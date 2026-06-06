import assert from "node:assert/strict";
import test from "node:test";

import { TRPCError } from "@trpc/server";

import { normalizeOptionalUrl, splitDisplayName } from "../src/lib/settings";
import { assertOrganizationDeleteConfirmation } from "../src/server/settings/policy";

test("normalizes optional logo URLs", () => {
  assert.equal(normalizeOptionalUrl(""), null);
  assert.equal(normalizeOptionalUrl("   "), null);
  assert.equal(
    normalizeOptionalUrl("  https://example.com/logo.png  "),
    "https://example.com/logo.png",
  );
});

test("splits a display name for Clerk profile updates", () => {
  assert.deepEqual(splitDisplayName("  Jane Mary Doe  "), {
    firstName: "Jane",
    lastName: "Mary Doe",
  });
  assert.deepEqual(splitDisplayName("Prince"), {
    firstName: "Prince",
    lastName: null,
  });
  assert.throws(() => splitDisplayName("   "), /Display name is required/);
});

test("requires an exact organization name before deletion", () => {
  assert.doesNotThrow(() =>
    assertOrganizationDeleteConfirmation("My Organization", "My Organization"),
  );

  assert.throws(
    () =>
      assertOrganizationDeleteConfirmation(
        "My Organization",
        "my organization",
      ),
    (error) =>
      error instanceof TRPCError &&
      error.code === "BAD_REQUEST" &&
      error.message.includes("does not match"),
  );
});
