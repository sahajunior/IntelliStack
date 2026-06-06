export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            IntelliStack
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Your analytics workspace
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to access your organization&apos;s dashboard.
          </p>
        </div>
        <div className="flex justify-center">{children}</div>
      </section>
    </main>
  );
}
