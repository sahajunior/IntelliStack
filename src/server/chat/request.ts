import { z } from "zod";

const chatRequestSchema = z
  .object({
    message: z
      .object({
        id: z.string().min(1).max(128),
        role: z.literal("user"),
        parts: z
          .array(
            z
              .object({
                type: z.literal("text"),
                text: z.string(),
              })
              .strict(),
          )
          .min(1)
          .max(8),
      })
      .strict(),
  })
  .strict();

export function parseChatRequest(input: unknown) {
  const request = chatRequestSchema.parse(input);
  const text = request.message.parts
    .map((part) => part.text)
    .join("")
    .trim();

  if (!text) {
    throw new Error("A user message is required");
  }

  if (text.length > 4_000) {
    throw new Error("Message exceeds the 4,000 character limit");
  }

  return {
    turnId: request.message.id,
    text,
  };
}
