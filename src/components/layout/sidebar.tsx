"use client";

import { OrganizationSwitcher, UserButton, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { label: "Dashboard", href: "/", enabled: true },
  { label: "Team", href: "/team", enabled: true },
  { label: "Settings", href: "/settings", enabled: true },
];

function MenuIcon({ open }: Readonly<{ open: boolean }>) {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      {open ? (
        <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      )}
    </svg>
  );
}

function DemoAccountControls({ compact = false }: Readonly<{ compact?: boolean }>) {
  const { signOut } = useClerk();

  return (
    <button
      className={`flex items-center gap-3 rounded-lg text-left text-sm text-slate-300 transition hover:text-white ${
        compact ? "px-2 py-1" : "w-full px-2 py-2"
      }`}
      onClick={() => void signOut({ redirectUrl: "/sign-in" })}
      type="button"
    >
      <span className="grid size-8 place-items-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
        D
      </span>
      <span>{compact ? "Sign out" : "Demo · Sign out"}</span>
    </button>
  );
}

function AccountControls({ isDemoUser }: Readonly<{ isDemoUser: boolean }>) {
  if (isDemoUser) {
    return <DemoAccountControls />;
  }

  return (
    <div className="flex items-center gap-3">
      <UserButton />
      <span className="text-sm text-slate-300">Account</span>
    </div>
  );
}

function SidebarContent({
  isDemoUser,
  onNavigate,
}: Readonly<{ isDemoUser: boolean; onNavigate?: () => void }>) {
  const pathname = usePathname();

  return (
    <>
      <div className="px-6 py-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
          IntelliStack
        </p>
        <p className="mt-1 text-sm text-slate-400">SaaS analytics</p>
      </div>

      <nav className="flex-1 px-3" aria-label="Main navigation">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.label}>
              {item.enabled ? (
                <Link
                  aria-current={
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href))
                      ? "page"
                      : undefined
                  }
                  className={`flex min-h-11 items-center justify-between rounded-lg px-3 py-2.5 text-sm ${
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href))
                      ? "bg-indigo-500 text-white"
                      : "text-slate-300 transition hover:bg-slate-900 hover:text-white"
                  }`}
                  href={item.href}
                  onClick={onNavigate}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="flex min-h-11 items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-500">
                  {item.label}
                  <span className="text-xs text-slate-500">Soon</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-slate-800 p-4">
        {isDemoUser ? (
          <div className="mb-4 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-200">
            Demo workspace · read-only
          </div>
        ) : (
          <div className="mb-4">
            <OrganizationSwitcher
              afterCreateOrganizationUrl="/"
              afterSelectOrganizationUrl="/"
              hidePersonal
            />
          </div>
        )}
        <AccountControls isDemoUser={isDemoUser} />
      </div>
    </>
  );
}

export function Sidebar({ isDemoUser }: Readonly<{ isDemoUser: boolean }>) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 text-white md:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            IntelliStack
          </p>
          <p className="text-xs text-slate-400">Organization dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          {isDemoUser ? <DemoAccountControls compact /> : <UserButton />}
          <button
            aria-expanded={open}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            className="grid size-11 place-items-center rounded-lg border border-slate-700 text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-800 bg-slate-950 text-white md:flex">
        <SidebarContent isDemoUser={isDemoUser} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            type="button"
          />
          <aside className="relative flex h-full w-[min(20rem,86vw)] flex-col bg-slate-950 text-white shadow-2xl">
            <div className="absolute right-4 top-4">
              <button
                aria-label="Close navigation menu"
                className="grid size-11 place-items-center rounded-lg border border-slate-700"
                onClick={() => setOpen(false)}
                type="button"
              >
                <MenuIcon open />
              </button>
            </div>
            <SidebarContent
              isDemoUser={isDemoUser}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
