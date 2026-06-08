import { clerkClient } from "@clerk/nextjs/server";

import {
  getDemoEmail,
  getDemoUserId,
  isSameOriginRequest,
} from "@/server/demo";

const tokenLifetimeSeconds = 60;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const demoUserId = getDemoUserId();
  const demoEmail = getDemoEmail();

  if (!demoUserId && !demoEmail) {
    return Response.json(
      { error: "Demo access is not configured." },
      { status: 503 },
    );
  }

  try {
    const client = await clerkClient();
    let userId = demoUserId;

    if (!userId && demoEmail) {
      const users = await client.users.getUserList({
        emailAddress: [demoEmail],
        limit: 2,
      });

      if (users.data.length !== 1) {
        console.error("Demo user lookup returned an unexpected result", {
          count: users.data.length,
        });
        return Response.json(
          {
            error:
              "Demo user was not found. Check DEMO_EMAIL in Vercel matches the Clerk demo user email.",
          },
          { status: 503 },
        );
      }

      userId = users.data[0].id;
    }

    if (!userId) {
      return Response.json(
        { error: "Demo access is not configured." },
        { status: 503 },
      );
    }

    const signInToken = await client.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: tokenLifetimeSeconds,
    });

    return Response.json(
      { ticket: signInToken.token },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Demo sign-in token creation failed", error);
    return Response.json(
      { error: "Demo account is unavailable." },
      { status: 503 },
    );
  }
}
