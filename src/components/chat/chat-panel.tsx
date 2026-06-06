"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { ChatMessage } from "@/components/chat/chat-message";
import { toUIMessage } from "@/lib/chat";
import type { PersistedChatMessage } from "@/lib/chat";
import { trpc } from "@/trpc/client";

const suggestions = [
  "Summarize our growth trend.",
  "What was our best revenue day?",
  "How has churn changed this month?",
];

function ChatIcon({ close = false }: Readonly<{ close?: boolean }>) {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {close ? (
        <path d="M6 6l12 12M18 6 6 18" />
      ) : (
        <path d="M7 8h10M7 12h7m-9 8 2.5-3H18a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 2 2.8V20Z" />
      )}
    </svg>
  );
}

function ChatSession({
  history,
}: Readonly<{ history: PersistedChatMessage[] }>) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    clearError,
  } = useChat({
    messages: history.map(toUIMessage),
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          message: messages.at(-1),
        },
      }),
    }),
    experimental_throttle: 40,
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const text = input.trim();

    if (!text || busy) {
      return;
    }

    clearError();
    setInput("");
    void sendMessage({ text });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <>
      <div
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 px-4 py-5"
      >
        {messages.length === 0 ? (
          <div className="my-auto text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
              <ChatIcon />
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">
              Ask about your workspace
            </h3>
            <p className="mx-auto mt-1 max-w-xs text-sm leading-5 text-slate-500">
              Responses use your organization&apos;s current KPI snapshot and
              recent metric history.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {suggestions.map((suggestion) => (
                <button
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  key={suggestion}
                  onClick={() => {
                    clearError();
                    void sendMessage({ text: suggestion });
                  }}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}

        {status === "submitted" ? (
          <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="size-1.5 animate-bounce rounded-full bg-indigo-400" />
            <span className="size-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:120ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:240ms]" />
            <span className="sr-only">Assistant is thinking</span>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      {error ? (
        <div className="border-t border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
          {error.message || "The assistant could not respond. Please try again."}
        </div>
      ) : null}

      <form
        className="border-t border-slate-200 bg-white p-3"
        onSubmit={submit}
      >
        <div className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
          <textarea
            aria-label="Message the analytics assistant"
            className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            disabled={busy}
            maxLength={4000}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about revenue, users, or churn…"
            rows={1}
            value={input}
          />
          {busy ? (
            <button
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-900 text-white"
              onClick={() => void stop()}
              title="Stop response"
              type="button"
            >
              <span className="size-3 rounded-sm bg-white" />
              <span className="sr-only">Stop response</span>
            </button>
          ) : (
            <button
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              disabled={!input.trim()}
              title="Send message"
              type="submit"
            >
              <svg
                aria-hidden="true"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13" />
              </svg>
              <span className="sr-only">Send message</span>
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          Nemotron may make mistakes. Verify important analytics.
        </p>
      </form>
    </>
  );
}

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const history = trpc.chat.getHistory.useQuery(undefined, {
    enabled: open,
    staleTime: 0,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      {open ? (
        <section
          aria-label="AI analytics assistant"
          className="fixed inset-0 z-50 flex animate-[chat-enter_180ms_ease-out] flex-col overflow-hidden bg-white shadow-2xl sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(42rem,calc(100vh-3rem))] sm:w-[26rem] sm:origin-bottom-right sm:rounded-2xl sm:border sm:border-slate-200"
        >
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-950 px-4 text-white">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">Analytics assistant</p>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-200">
                  Nemotron
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Organization-scoped answers
              </p>
            </div>
            <button
              aria-label="Close analytics assistant"
              className="grid size-10 place-items-center rounded-lg border border-slate-700 text-slate-200 transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
              onClick={() => setOpen(false)}
              type="button"
            >
              <ChatIcon close />
            </button>
          </header>

          {history.isPending || history.isFetching ? (
            <div className="flex flex-1 flex-col gap-3 bg-slate-50 p-4">
              <div className="h-16 w-4/5 animate-pulse rounded-2xl bg-slate-200" />
              <div className="ml-auto h-12 w-3/5 animate-pulse rounded-2xl bg-indigo-100" />
              <div className="h-20 w-5/6 animate-pulse rounded-2xl bg-slate-200" />
            </div>
          ) : history.error ? (
            <div className="m-auto max-w-xs p-6 text-center">
              <p className="text-sm text-rose-700">
                Chat history could not be loaded: {history.error.message}
              </p>
              <button
                className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                onClick={() => void history.refetch()}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : (
            <ChatSession history={history.data ?? []} />
          )}
        </section>
      ) : null}

      <button
        aria-expanded={open}
        aria-label="Open analytics assistant"
        className={`fixed bottom-5 right-5 z-40 min-h-12 items-center gap-2 rounded-full bg-indigo-600 px-4 font-semibold text-white shadow-lg shadow-indigo-950/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:bottom-6 sm:right-6 ${
          open ? "hidden" : "flex"
        }`}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <ChatIcon />
        <span className="text-sm">Ask AI</span>
      </button>
    </>
  );
}
