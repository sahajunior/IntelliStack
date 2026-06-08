import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ChatPanel } from "@/components/chat/chat-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { LivePresenceBadge } from "@/components/dashboard/live-presence-badge";
import { TRPCProvider } from "@/trpc/provider";
import { isDemoUser } from "@/server/demo";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  if (!orgId) {
    redirect("/create-organization");
  }

  const user = await currentUser();
  const demoMode = isDemoUser(user);

  return (
    <div className="min-h-screen">
      <Sidebar isDemoUser={demoMode} />
      <div className="min-w-0 md:ml-72">
        <header className="hidden h-16 items-center justify-between border-b border-slate-200 bg-white/85 px-8 backdrop-blur md:flex">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
              Active workspace
            </p>
            <p className="text-sm font-semibold">Organization dashboard</p>
          </div>
          <LivePresenceBadge orgId={orgId} />
        </header>
        <TRPCProvider>
          <main className="p-4 sm:p-6 md:p-8">{children}</main>
          <ChatPanel />
        </TRPCProvider>
      </div>
    </div>
  );
}
