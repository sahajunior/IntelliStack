"use client";

import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";

import { getMessageText } from "@/lib/chat";

export function ChatMessage({
  message,
}: Readonly<{ message: UIMessage }>) {
  const content = getMessageText(message);
  const assistant = message.role === "assistant";

  if (!content) {
    return null;
  }

  return (
    <article
      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
        assistant
          ? "self-start rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
          : "self-end rounded-br-md bg-indigo-600 text-white"
      }`}
    >
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-65">
        {assistant ? "IntelliStack AI" : "You"}
      </p>
      {assistant ? (
        <ReactMarkdown
          components={{
            a: ({ children, ...props }) => (
              <a
                className="font-medium text-indigo-600 underline underline-offset-2"
                rel="noreferrer"
                target="_blank"
                {...props}
              >
                {children}
              </a>
            ),
            code: ({ children }) => (
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-800">
                {children}
              </code>
            ),
            li: ({ children }) => <li className="ml-4 list-disc">{children}</li>,
            p: ({ children }) => <p className="my-1 first:mt-0 last:mb-0">{children}</p>,
            strong: ({ children }) => (
              <strong className="font-semibold text-slate-950">{children}</strong>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      ) : (
        <p className="whitespace-pre-wrap">{content}</p>
      )}
    </article>
  );
}
