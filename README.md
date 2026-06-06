# IntelliStack

IntelliStack is a multi-tenant SaaS analytics dashboard. This repository
currently implements **Phases 1–7** from [`PLAN.md`](./PLAN.md): the Next.js
foundation, Clerk authentication, organization selection, Neon PostgreSQL,
Drizzle migrations, tenant-scoped tRPC metrics, responsive KPI cards, and
revenue/signup charts, plus a Pusher-backed real-time activity feed and
organization presence count. A streamed OpenRouter chat assistant answers
questions using the active organization's KPI history. The Clerk-backed Team
page lists members and pending invitations, with admin-only invitation, role,
removal, and cancellation controls. The Settings page supports organization
branding, Clerk profile updates, notification preferences, dirty-state
warnings, and an admin-only typed-confirmation danger zone.

## Requirements

- Node.js 20.9 or newer
- A Clerk application with Organizations enabled

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add the publishable and secret keys from the Clerk dashboard to `.env.local`.
In Clerk, enable Organizations and require organization membership for the
intended signup flow.

Add the pooled Neon PostgreSQL connection string as `DATABASE_URL`.

Create a Pusher Channels application and add its app key, cluster, app ID, and
secret using the variable names in `.env.example`.

Create an OpenRouter API key and configure `OPENROUTER_MODEL`. The development
default uses `nvidia/nemotron-3-super-120b-a12b:free`.

Then open <http://localhost:3000>. An unauthenticated visitor is sent to
`/sign-in`; a signed-in user without an active organization is sent to
`/create-organization`.

## Database

Generate and apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

Seed 30 days of metrics for an active Clerk organization:

```bash
npm run db:seed -- --org-id=org_your_clerk_org_id
```

The seed is idempotent: rerunning it updates the same organization/date rows
instead of inserting duplicates.

## Real-time verification

Open the dashboard in two tabs using the same Clerk organization. Click
**Send test event** in either tab. The event should appear in both feeds, and
the online member badge should update as tabs connect or close.

## AI chat verification

Open **Ask AI** and ask, “What was our best revenue day?” Responses stream into
the panel and are persisted per Clerk user and organization.

## Team verification

Open **Team** as an organization administrator. Invite a real secondary email,
accept the invitation, then verify that role changes and removal update the
member list immediately. A non-admin member can view the page but cannot see or
invoke administrative controls.

## Settings verification

Open **Settings** as an organization administrator. Change the organization
name or logo URL, save, and reload to verify persistence. Update the personal
display name and notification preference, then sign in as a non-admin member
to confirm that organization fields are read-only. The delete dialog requires
the exact Clerk organization name before enabling deletion; use a disposable
organization if testing the destructive action.

## Verification

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Live signup, organization creation, switching, sign-out, and sign-in require
valid Clerk keys and cannot be verified using placeholder credentials.
