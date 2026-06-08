import assert from "node:assert/strict";
import test from "node:test";

import { getDemoEmail, isSameOriginRequest } from "@/server/demo";

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

  process.env.DEMO_EMAIL = "server@example.com";
  process.env.NEXT_PUBLIC_DEMO_EMAIL = "public@example.com";

  assert.equal(getDemoEmail(), "server@example.com");

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
});
