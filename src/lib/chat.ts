import type { UIMessage } from "ai";

export type PersistedChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export function getMessageText(message: Pick<UIMessage, "parts">) {
  return message.parts
    .filter(
      (part): part is Extract<(typeof message.parts)[number], { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join("");
}

export function toUIMessage(message: PersistedChatMessage): UIMessage {
  return {
    id: message.id,
    role: message.role,
    parts: [{ type: "text", text: message.content }],
    metadata: {
      createdAt: message.createdAt,
    },
  };
}
