"use client";

import { useEffect, useState } from "react";

import { trpc } from "@/trpc/client";

export function DeleteOrganizationModal({
  organizationName,
  onClose,
}: Readonly<{
  organizationName: string;
  onClose: () => void;
}>) {
  const [confirmation, setConfirmation] = useState("");
  const mutation = trpc.settings.deleteOrganization.useMutation({
    onSuccess: () => {
      window.location.assign("/sign-in");
    },
  });

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !mutation.isPending) {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [mutation.isPending, onClose]);

  const confirmed = confirmation === organizationName;

  return (
    <div
      aria-labelledby="delete-organization-title"
      aria-modal="true"
      className="fixed inset-0 z-[60] grid place-items-center p-4"
      role="dialog"
    >
      <button
        aria-label="Close delete organization dialog"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        disabled={mutation.isPending}
        onClick={onClose}
        type="button"
      />
      <div className="relative w-full max-w-lg animate-[chat-enter_180ms_ease-out] rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl">
        <div className="grid size-11 place-items-center rounded-xl bg-rose-100 text-rose-700">
          <svg
            aria-hidden="true"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M12 9v4m0 4h.01M10.3 3.7 2.5 17.2A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.8L13.7 3.7a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>
        <h2
          className="mt-4 text-xl font-semibold tracking-tight text-slate-950"
          id="delete-organization-title"
        >
          Delete organization
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This permanently deletes the Clerk organization and removes access
          for every member. This action cannot be undone.
        </p>

        <label className="mt-5 block">
          <span className="text-sm font-medium text-slate-700">
            Type <strong>{organizationName}</strong> to confirm
          </span>
          <input
            autoFocus
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            disabled={mutation.isPending}
            onChange={(event) => setConfirmation(event.target.value)}
            value={confirmation}
          />
        </label>

        {mutation.error ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {mutation.error.message}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            disabled={mutation.isPending}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-200"
            disabled={!confirmed || mutation.isPending}
            onClick={() => mutation.mutate({ confirmation })}
            type="button"
          >
            {mutation.isPending ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
