"use client";

import { FormEvent, useEffect, useState } from "react";

import type { OrganizationRole } from "@/server/team/policy";
import { trpc } from "@/trpc/client";

export function InviteModal({
  onClose,
}: Readonly<{ onClose: () => void }>) {
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrganizationRole>("org:member");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const mutation = trpc.team.createInvitation.useMutation({
    onSuccess: async (invitation) => {
      setSentTo(invitation.email);
      await utils.team.getPendingInvitations.invalidate();
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

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail || mutation.isPending) {
      return;
    }

    mutation.mutate({ email: normalizedEmail, role });
  };

  return (
    <div
      aria-labelledby="invite-member-title"
      aria-modal="true"
      className="fixed inset-0 z-[60] grid place-items-center p-4"
      role="dialog"
    >
      <button
        aria-label="Close invite dialog"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        disabled={mutation.isPending}
        onClick={onClose}
        type="button"
      />
      <div className="relative w-full max-w-md animate-[chat-enter_180ms_ease-out] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">Team access</p>
            <h2
              className="mt-1 text-xl font-semibold tracking-tight text-slate-950"
              id="invite-member-title"
            >
              Invite a member
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Clerk will email a secure organization invitation.
            </p>
          </div>
          <button
            aria-label="Close invite dialog"
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            disabled={mutation.isPending}
            onClick={onClose}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {sentTo ? (
          <div className="mt-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Invitation sent to <strong>{sentTo}</strong>.
            </div>
            <button
              className="mt-5 w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={onClose}
              type="button"
            >
              Done
            </button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Email address
              </span>
              <input
                autoFocus
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                disabled={mutation.isPending}
                maxLength={254}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Role</span>
              <select
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                disabled={mutation.isPending}
                onChange={(event) =>
                  setRole(event.target.value as OrganizationRole)
                }
                value={role}
              >
                <option value="org:member">Member</option>
                <option value="org:admin">Administrator</option>
              </select>
            </label>

            {mutation.error ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {mutation.error.message}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                disabled={mutation.isPending}
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!email.trim() || mutation.isPending}
                type="submit"
              >
                {mutation.isPending ? "Sending…" : "Send invitation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
