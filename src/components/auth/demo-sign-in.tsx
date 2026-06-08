"use client";

import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignIn as useLegacySignIn } from "@clerk/nextjs/legacy";
import { useState } from "react";

async function readDemoSessionPayload(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return (await response.json()) as unknown;
  }

  return {
    error: `Demo service returned ${response.status}. Please retry after deploy finishes.`,
  };
}

function getDemoSessionError(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return "Demo ticket request failed.";
}

export function DemoSignIn() {
  const {
    isLoaded,
    signIn: legacySignIn,
    setActive,
  } = useLegacySignIn();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const signInAsDemo = async () => {
    setError(null);

    if (!isLoaded || !legacySignIn) {
      setError("Demo sign-in is still loading. Please try again.");
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/demo-session", {
        method: "POST",
      });
      const payload = await readDemoSessionPayload(response);

      if (!response.ok) {
        throw new Error(getDemoSessionError(payload));
      }

      if (
        typeof payload !== "object" ||
        payload === null ||
        !("ticket" in payload) ||
        typeof payload.ticket !== "string"
      ) {
        throw new Error("Demo ticket request failed.");
      }

      const result = await legacySignIn.create({
        strategy: "ticket",
        ticket: payload.ticket,
      });

      if (result.status !== "complete" || !result.createdSessionId) {
        setError("Demo account could not create a session.");
        return;
      }

      await setActive({ session: result.createdSessionId });
      window.location.assign("/");
    } catch (signInError) {
      setError(
        isClerkAPIResponseError(signInError)
          ? (signInError.errors[0]?.longMessage ??
              "Demo credentials are unavailable.")
          : signInError instanceof Error
            ? signInError.message
          : "Demo sign-in failed. Please try again shortly.",
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section className="mb-4 w-full rounded-xl border border-indigo-200 bg-indigo-50 p-4">
      <p className="text-sm font-semibold text-slate-950">
        Explore without creating an account
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        Open the preloaded workspace as a read-only organization member.
      </p>
      <button
        className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        disabled={!isLoaded || isPending}
        onClick={signInAsDemo}
        type="button"
      >
        {isPending ? "Opening demo…" : "Try Demo"}
      </button>
      {error ? (
        <p className="mt-2 text-xs font-medium text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
