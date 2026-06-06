import { CreateOrganization } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function CreateOrganizationPage() {
  const { orgId } = await auth();

  if (orgId) {
    redirect("/");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          IntelliStack
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Create your workspace
        </h1>
        <p className="mb-8 mt-2 text-sm text-slate-600">
          Every dashboard belongs to an organization so tenant data stays
          isolated.
        </p>
        <div className="flex justify-center">
          <CreateOrganization
            afterCreateOrganizationUrl="/"
            skipInvitationScreen
          />
        </div>
      </section>
    </main>
  );
}
