import assert from "node:assert/strict";
import test from "node:test";

import { TRPCError } from "@trpc/server";

import {
  assertNotDemoUser,
  getDemoEmail,
  isDemoAccount,
  isSameOriginRequest,
} from "@/server/demo";

test("accepts only same-origin demo session requests", () => {
  assert.equal(
    isSameOriginRequest(
      new Request("https://intelli-stack.vercel.app/api/demo-session", {
        headers: {
          origin: "https://intelli-stack.vercel.app",
        },
      }),
    ),
    true,
  );

  assert.equal(
    isSameOriginRequest(
      new Request("https://intelli-stack.vercel.app/api/demo-session", {
        headers: {
          origin: "https://example.com",
        },
      }),
    ),
    false,
  );
});

test("prefers the server-only demo email", () => {
  const originalDemoEmail = process.env.DEMO_EMAIL;
  const originalPublicDemoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL;

  try {
    process.env.DEMO_EMAIL = "server@example.com";
    process.env.NEXT_PUBLIC_DEMO_EMAIL = "public@example.com";

    assert.equal(getDemoEmail(), "server@example.com");
  } finally {
    if (originalDemoEmail === undefined) {
      delete process.env.DEMO_EMAIL;
    } else {
      process.env.DEMO_EMAIL = originalDemoEmail;
    }

    if (originalPublicDemoEmail === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_EMAIL;
    } else {
      process.env.NEXT_PUBLIC_DEMO_EMAIL = originalPublicDemoEmail;
    }
  }
});

test("identifies demo users by configured user id or email", () => {
  const originalDemoUserId = process.env.DEMO_USER_ID;
  const originalDemoEmail = process.env.DEMO_EMAIL;

  try {
    process.env.DEMO_USER_ID = "user_demo";
    process.env.DEMO_EMAIL = "demo@example.com";

    assert.equal(isDemoAccount({ userId: "user_demo" }), true);
    assert.equal(isDemoAccount({ email: " Demo@Example.com " }), true);
    assert.equal(isDemoAccount({ userId: "user_real" }), false);
    assert.equal(isDemoAccount({ email: "real@example.com" }), false);
  } finally {
    if (originalDemoUserId === undefined) {
      delete process.env.DEMO_USER_ID;
    } else {
      process.env.DEMO_USER_ID = originalDemoUserId;
    }

    if (originalDemoEmail === undefined) {
      delete process.env.DEMO_EMAIL;
    } else {
      process.env.DEMO_EMAIL = originalDemoEmail;
    }
  }
});

test("blocks writes from demo users", () => {
  assert.doesNotThrow(() => assertNotDemoUser(false));
  assert.throws(
    () => assertNotDemoUser(true),
    (error) =>
      error instanceof TRPCError &&
      error.code === "FORBIDDEN" &&
      error.message === "Demo account is read-only.",
  );
});
