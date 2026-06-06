import assert from "node:assert/strict";
import test from "node:test";

import { and, eq } from "drizzle-orm";

import {
  getTrustedChatHistory,
  persistCompletedChatTurn,
  shouldPersistChatTurn,
} from "@/server/chat/messages";
import { db } from "@/server/db";
import { chatMessages } from "@/server/db/schema";

test("tenant history is isolated by organization and user", async () => {
  const suffix = crypto.randomUUID();
  const orgId = `phase5-test-org-${suffix}`;
  const otherOrgId = `phase5-test-other-org-${suffix}`;
  const userId = `phase5-test-user-${suffix}`;
  const otherUserId = `phase5-test-other-user-${suffix}`;

  try {
    await db.insert(chatMessages).values([
      {
        orgId,
        userId,
        role: "user",
        content: "visible",
      },
      {
        orgId: otherOrgId,
        userId,
        role: "user",
        content: "wrong organization",
      },
      {
        orgId,
        userId: otherUserId,
        role: "user",
        content: "wrong user",
      },
    ]);

    const history = await getTrustedChatHistory(orgId, userId);

    assert.deepEqual(
      history.map((message) => message.content),
      ["visible"],
    );
  } finally {
    await db
      .delete(chatMessages)
      .where(
        and(
          eq(chatMessages.orgId, orgId),
          eq(chatMessages.userId, userId),
        ),
      );
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.orgId, otherOrgId));
    await db
      .delete(chatMessages)
      .where(
        and(
          eq(chatMessages.orgId, orgId),
          eq(chatMessages.userId, otherUserId),
        ),
      );
  }
});

test("completed turns are paired and idempotent", async () => {
  const suffix = crypto.randomUUID();
  const orgId = `phase5-test-org-${suffix}`;
  const userId = `phase5-test-user-${suffix}`;
  const turnId = `phase5-test-turn-${suffix}`;
  const turn = {
    orgId,
    userId,
    turnId,
    userText: "Question",
    assistantText: "Answer",
  };

  try {
    await persistCompletedChatTurn(turn);
    await persistCompletedChatTurn(turn);

    const rows = await db
      .select({
        role: chatMessages.role,
        content: chatMessages.content,
      })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.orgId, orgId),
          eq(chatMessages.userId, userId),
          eq(chatMessages.turnId, turnId),
        ),
      );

    assert.equal(rows.length, 2);
    assert.deepEqual(
      new Set(rows.map((row) => row.role)),
      new Set(["user", "assistant"]),
    );
  } finally {
    await db.delete(chatMessages).where(eq(chatMessages.orgId, orgId));
  }
});

test("failed, aborted, and empty generations are not persisted", () => {
  assert.equal(shouldPersistChatTurn("error", "partial"), false);
  assert.equal(shouldPersistChatTurn("other", "partial"), false);
  assert.equal(shouldPersistChatTurn("stop", "   "), false);
  assert.equal(shouldPersistChatTurn("stop", "complete"), true);
  assert.equal(shouldPersistChatTurn("length", "complete"), true);
});
