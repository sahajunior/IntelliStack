"use client";

import { useOrganization, useUser } from "@clerk/nextjs";
import type { inferRouterOutputs } from "@trpc/server";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { DeleteOrganizationModal } from "@/components/settings/delete-organization-modal";
import { splitDisplayName } from "@/lib/settings";
import type { AppRouter } from "@/server/trpc/router";
import { trpc } from "@/trpc/client";

type SaveState = "idle" | "saved";
type SettingsData = inferRouterOutputs<AppRouter>["settings"]["getSettings"];

export function SettingsPage() {
  const query = trpc.settings.getSettings.useQuery();

  if (query.isPending) {
    return (
      <section aria-label="Loading settings" className="space-y-6">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </section>
    );
  }

  if (query.error || !query.data) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        Settings could not be loaded: {query.error?.message ?? "Unknown error"}
      </section>
    );
  }

  return <SettingsForm key={query.data.orgId} settings={query.data} />;
}

function SettingsForm({ settings }: Readonly<{ settings: SettingsData }>) {
  const { organization } = useOrganization();
  const { isLoaded: userLoaded, user } = useUser();
  const utils = trpc.useUtils();
  const [organizationName, setOrganizationName] = useState(
    settings.organization.name,
  );
  const [logoUrl, setLogoUrl] = useState(settings.organization.logoUrl);
  const [displayName, setDisplayName] = useState(
    settings.personal.displayName,
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    settings.personal.notificationsEnabled,
  );
  const [organizationSaveState, setOrganizationSaveState] =
    useState<SaveState>("idle");
  const [personalSaveState, setPersonalSaveState] =
    useState<SaveState>("idle");
  const [personalError, setPersonalError] = useState<string | null>(null);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const organizationDirty =
    organizationName !== settings.organization.name ||
    logoUrl !== settings.organization.logoUrl;
  const displayNameDirty = displayName !== settings.personal.displayName;
  const notificationsDirty =
    notificationsEnabled !== settings.personal.notificationsEnabled;
  const personalDirty = displayNameDirty || notificationsDirty;
  const dirty = organizationDirty || personalDirty;

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  const updateOrganization = trpc.settings.updateOrganization.useMutation({
    onSuccess: async () => {
      setOrganizationSaveState("saved");
      await Promise.all([
        utils.settings.getSettings.invalidate(),
        organization?.reload(),
      ]);
      window.setTimeout(() => setOrganizationSaveState("idle"), 2_000);
    },
  });
  const updateNotifications = trpc.settings.updateNotifications.useMutation();

  const saveOrganization = (event: FormEvent) => {
    event.preventDefault();

    if (!organizationDirty || updateOrganization.isPending) {
      return;
    }

    setOrganizationSaveState("idle");
    updateOrganization.mutate({
      displayName: organizationName,
      logoUrl,
    });
  };

  const savePersonal = async (event: FormEvent) => {
    event.preventDefault();

    if (
      !personalDirty ||
      personalSaving ||
      (displayNameDirty && (!userLoaded || !user))
    ) {
      return;
    }

    setPersonalError(null);
    setPersonalSaveState("idle");
    setPersonalSaving(true);

    try {
      const updates: Promise<unknown>[] = [];

      if (displayNameDirty && user) {
        updates.push(user.update(splitDisplayName(displayName)));
      }

      if (notificationsDirty) {
        updates.push(
          updateNotifications.mutateAsync({ enabled: notificationsEnabled }),
        );
      }

      await Promise.all(updates);
      await utils.settings.getSettings.invalidate();
      setPersonalSaveState("saved");
      window.setTimeout(() => setPersonalSaveState("idle"), 2_000);
    } catch (error) {
      setPersonalError(
        error instanceof Error
          ? error.message
          : "Personal settings could not be saved.",
      );
    } finally {
      setPersonalSaving(false);
    }
  };

  const previewInitials = useMemo(
    () =>
      organizationName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "OR",
    [organizationName],
  );

  const isAdmin = settings.isOrgAdmin;

  return (
    <>
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">Workspace</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Settings
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Manage organization presentation and your account preferences.
            </p>
          </div>
          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              dirty
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {dirty ? "Unsaved changes" : "All changes saved"}
          </span>
        </div>

        <form
          className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          onSubmit={saveOrganization}
        >
          <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
            <span
              className="grid size-16 shrink-0 place-items-center rounded-2xl bg-indigo-100 bg-cover bg-center font-semibold text-indigo-700"
              style={
                logoUrl ? { backgroundImage: `url("${logoUrl}")` } : undefined
              }
            >
              {logoUrl ? null : previewInitials}
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Organization settings
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isAdmin
                  ? "Update the workspace name and optional hosted logo."
                  : "Organization settings are read-only for members."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Display name
              </span>
              <input
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                disabled={!isAdmin || updateOrganization.isPending}
                maxLength={100}
                onChange={(event) => setOrganizationName(event.target.value)}
                required
                value={organizationName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Logo URL
              </span>
              <input
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                disabled={!isAdmin || updateOrganization.isPending}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="https://example.com/logo.png"
                type="url"
                value={logoUrl}
              />
            </label>
          </div>

          {updateOrganization.error ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {updateOrganization.error.message}
            </p>
          ) : null}

          {isAdmin ? (
            <div className="mt-6 flex justify-end">
              <button
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!organizationDirty || updateOrganization.isPending}
                type="submit"
              >
                {updateOrganization.isPending
                  ? "Saving…"
                  : organizationSaveState === "saved"
                    ? "Saved"
                    : "Save organization"}
              </button>
            </div>
          ) : null}
        </form>

        <form
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          onSubmit={savePersonal}
        >
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Personal settings
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Update your Clerk profile and workspace email preference.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Display name
              </span>
              <input
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                disabled={personalSaving}
                maxLength={100}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                value={displayName}
              />
            </label>

            <label className="flex min-h-[4.5rem] items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-slate-700">
                  Email notifications
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Receive workspace update emails.
                </span>
              </span>
              <input
                checked={notificationsEnabled}
                className="size-5 accent-indigo-600"
                disabled={personalSaving}
                onChange={(event) =>
                  setNotificationsEnabled(event.target.checked)
                }
                type="checkbox"
              />
            </label>
          </div>

          {personalError ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {personalError}
            </p>
          ) : null}

          <div className="mt-6 flex justify-end">
            <button
              className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!personalDirty || personalSaving}
              type="submit"
            >
              {personalSaving
                ? "Saving…"
                : personalSaveState === "saved"
                  ? "Saved"
                  : "Save personal settings"}
            </button>
          </div>
        </form>

        {isAdmin ? (
          <section className="mt-6 rounded-2xl border border-rose-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight text-rose-700">
              Danger zone
            </h2>
            <div className="mt-4 flex flex-col gap-4 rounded-xl border border-rose-100 bg-rose-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  Delete this organization
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Permanently remove the workspace and all Clerk memberships.
                </p>
              </div>
              <button
                className="shrink-0 rounded-lg border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-600 hover:text-white"
                onClick={() => setDeleteOpen(true)}
                type="button"
              >
                Delete organization
              </button>
            </div>
          </section>
        ) : null}
      </section>

      {deleteOpen ? (
        <DeleteOrganizationModal
          onClose={() => setDeleteOpen(false)}
          organizationName={settings.organization.clerkName}
        />
      ) : null}
    </>
  );
}
