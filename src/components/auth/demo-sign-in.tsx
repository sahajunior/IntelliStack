"use client";

import { useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignIn as useLegacySignIn } from "@clerk/nextjs/legacy";
import { useState } from "react";

const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL;
const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

export function DemoSignIn() {
  const { fetchStatus } = useSignIn();
  const {
    isLoaded,
    signIn: legacySignIn,
    setActive,
  } = useLegacySignIn();
  const [error, setError] = useState<string | null>(null);

  if (!demoEmail || !demoPassword) {
    return null;
  }

  const signInAsDemo = async () => {
    setError(null);

    if (!isLoaded || !legacySignIn) {
      setError("Demo sign-in is still loading. Please try again.");
      return;
    }

    try {
      const result = await legacySignIn.create({
        identifier: demoEmail,
        password: demoPassword,
        strategy: "password",
      });

      if (result.status !== "complete" || !result.createdSessionId) {
        setError("Demo account requires an additional sign-in step.");
        return;
      }

      await setActive({ session: result.createdSessionId });
      window.location.assign("/");
    } catch (signInError) {
      setError(
        isClerkAPIResponseError(signInError)
          ? (signInError.errors[0]?.longMessage ??
              "Demo credentials are unavailable.")
          : "Demo sign-in failed. Please try again shortly.",
      );
    }
  };

  const isPending = !isLoaded || fetchStatus === "fetching";

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
        disabled={isPending}
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
