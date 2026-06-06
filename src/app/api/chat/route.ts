import { auth, clerkClient } from "@clerk/nextjs/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { and, asc, eq, gte } from "drizzle-orm";
import { ZodError } from "zod";

import { toUIMessage } from "@/lib/chat";
import {
  getTrustedChatHistory,
  persistCompletedChatTurn,
  shouldPersistChatTurn,
} from "@/server/chat/messages";
import { parseChatRequest } from "@/server/chat/request";
import { db } from "@/server/db";
import { metrics } from "@/server/db/schema";

export const maxDuration = 60;

function requiredEnvironmentValue(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function dateDaysAgo(days: number) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

function formatDollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);

    if (contentLength > 16_384) {
      return new Response("Chat request is too large", { status: 413 });
    }

    const { turnId, text: latestUserText } = parseChatRequest(
      await request.json(),
    );
    const [organization, metricRows, trustedHistory] = await Promise.all([
      (await clerkClient()).organizations.getOrganization({
        organizationId: orgId,
      }),
      db
        .select({
          date: metrics.date,
          mrr: metrics.mrr,
          newUsers: metrics.newUsers,
          activeSessions: metrics.activeSessions,
          churnRate: metrics.churnRate,
        })
        .from(metrics)
        .where(
          and(
            eq(metrics.orgId, orgId),
            gte(metrics.date, dateDaysAgo(29)),
          ),
        )
        .orderBy(asc(metrics.date)),
      getTrustedChatHistory(orgId, userId),
    ]);

    const latestMetrics = metricRows.at(-1);
    const currentUserMessage: UIMessage = {
      id: turnId,
      role: "user",
      parts: [{ type: "text", text: latestUserText }],
    };
    const trustedMessages = [
      ...trustedHistory.map(toUIMessage),
      currentUserMessage,
    ];

    const openrouter = createOpenRouter({
      apiKey: requiredEnvironmentValue("OPENROUTER_API_KEY"),
      compatibility: "strict",
      appName: "IntelliStack",
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    });
    const model = process.env.OPENROUTER_MODEL?.replace(/^["']|["']$/g, "");

    if (!model) {
      throw new Error("OPENROUTER_MODEL is not configured");
    }

    const historyContext = metricRows
      .map(
        (row) =>
          `${row.date}: MRR ${formatDollars(row.mrr)}, new users ${
            row.newUsers
          }, active sessions ${row.activeSessions}, churn ${row.churnRate.toFixed(
            1,
          )}%`,
      )
      .join("\n");
    const result = streamText({
      model: openrouter.chat(model, {
        reasoning: {
          effort: "none",
          exclude: true,
        },
      }),
      system: `You are IntelliStack's analytics assistant for the organization "${
        organization.name
      }".
The current user's organization role is ${orgRole ?? "member"}.

Current KPI snapshot:
${
  latestMetrics
    ? `MRR ${formatDollars(latestMetrics.mrr)}, new users ${
        latestMetrics.newUsers
      }, active sessions ${latestMetrics.activeSessions}, churn ${latestMetrics.churnRate.toFixed(
        1,
      )}%.`
    : "No metrics are currently available."
}

Recent daily organization metrics:
${historyContext || "No recent metric history is available."}

Answer concisely using only the supplied organization data. You may calculate totals, changes, best/worst days, and trends from it. If the requested information is not present, say that clearly. Never invent company, customer, billing, or user-level facts.`,
      messages: await convertToModelMessages(trustedMessages),
      maxOutputTokens: 700,
      temperature: 0.2,
      abortSignal: request.signal,
      onFinish: async ({ finishReason, text }) => {
        const assistantText = text.trim();

        if (shouldPersistChatTurn(finishReason, assistantText)) {
          await persistCompletedChatTurn({
            orgId,
            userId,
            turnId,
            userText: latestUserText,
            assistantText,
          });
        }
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: trustedMessages,
      onError: (error) => {
        console.error("OpenRouter chat stream failed", error);
        return "The analytics assistant is temporarily unavailable. Please try again.";
      },
    });
  } catch (error) {
    console.error("Chat request failed", error);

    if (
      error instanceof ZodError ||
      (error instanceof Error &&
        [
          "A user message is required",
          "Message exceeds the 4,000 character limit",
        ].includes(error.message))
    ) {
      return new Response("Invalid chat request", { status: 400 });
    }

    return new Response("The chat request could not be processed", {
      status: 500,
    });
  }
}
