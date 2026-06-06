import { and, desc, eq } from "drizzle-orm";

import type { PersistedChatMessage } from "@/lib/chat";
import { db } from "@/server/db";
import { chatMessages } from "@/server/db/schema";

const MAX_HISTORY_MESSAGES = 30;

export function shouldPersistChatTurn(
  finishReason: string,
  assistantText: string,
) {
  return (
    Boolean(assistantText.trim()) &&
    (finishReason === "stop" || finishReason === "length")
  );
}

export async function getTrustedChatHistory(
  orgId: string,
  userId: string,
  limit = MAX_HISTORY_MESSAGES,
): Promise<PersistedChatMessage[]> {
  const rows = await db
    .select({
      id: chatMessages.id,
      role: chatMessages.role,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.orgId, orgId),
        eq(chatMessages.userId, userId),
      ),
    )
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);

  return rows.reverse().map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function persistCompletedChatTurn(input: {
  orgId: string;
  userId: string;
  turnId: string;
  userText: string;
  assistantText: string;
}) {
  await db.batch([
    db
      .insert(chatMessages)
      .values({
        orgId: input.orgId,
        userId: input.userId,
        turnId: input.turnId,
        role: "user",
        content: input.userText,
      })
      .onConflictDoNothing(),
    db
      .insert(chatMessages)
      .values({
        orgId: input.orgId,
        userId: input.userId,
        turnId: input.turnId,
        role: "assistant",
        content: input.assistantText,
      })
      .onConflictDoNothing(),
  ]);
}
