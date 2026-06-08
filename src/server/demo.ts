import { TRPCError } from "@trpc/server";

export function getDemoEmail() {
  return process.env.DEMO_EMAIL ?? process.env.NEXT_PUBLIC_DEMO_EMAIL;
}

export function getDemoUserId() {
  return process.env.DEMO_USER_ID;
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? null;
}

export function isDemoAccount(input: {
  email?: string | null;
  userId?: string | null;
}) {
  const demoUserId = getDemoUserId();

  if (demoUserId && input.userId === demoUserId) {
    return true;
  }

  const demoEmail = normalizeEmail(getDemoEmail());

  return Boolean(demoEmail && normalizeEmail(input.email) === demoEmail);
}

export function isDemoUser(user: {
  id?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
} | null | undefined) {
  return isDemoAccount({
    email: user?.primaryEmailAddress?.emailAddress,
    userId: user?.id,
  });
}

export function assertNotDemoUser(isDemoAccountUser: boolean) {
  if (isDemoAccountUser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Demo account is read-only.",
    });
  }
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");

  return origin !== null && origin === new URL(request.url).origin;
}
