# IntelliStack

IntelliStack is a multi-tenant analytics dashboard for SaaS teams. Each organization has its own metrics, members, activity feed, settings, and AI chat history.

**Live demo:** [intelli-stack.vercel.app](https://intelli-stack.vercel.app)

## Features

### Analytics dashboard

- Revenue, new users, active sessions, and churn KPIs
- 30-day revenue chart
- Weekly signup chart
- Organization-scoped data
- Responsive desktop and mobile layout

### Authentication and organizations

- Email and Google sign-in with Clerk
- Organization creation and switching
- Administrator and member roles
- Tenant isolation using the active Clerk organization

### Real-time activity

- Live workspace events with Pusher Channels
- Recent activity history
- Online member count through presence channels

### AI assistant

- Streaming responses through OpenRouter and the Vercel AI SDK
- Answers based on the active organization's metrics
- Chat history stored per user and organization
- Markdown response rendering

### Team management

- Organization member list
- Member invitations
- Role changes
- Member removal
- Pending invitation management
- Server-side administrator checks

### Settings

- Organization name and logo URL
- Personal display name
- Email notification preference
- Organization deletion with typed confirmation

### Public demo

- One-click demo sign-in
- Short-lived Clerk sign-in tokens
- No public demo password
- Read-only access
- Team emails and invitations hidden
- Account, organization, and mutation controls locked

## Tech Stack

| Area | Technology |
|---|---|
| Framework | Next.js 16 |
| Language | TypeScript |
| Authentication | Clerk |
| API | tRPC |
| Database | Neon PostgreSQL |
| ORM | Drizzle ORM |
| Real-time | Pusher Channels |
| AI | OpenRouter + Vercel AI SDK |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| CI | GitHub Actions |

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the environment file

```bash
cp .env.example .env.local
```

Add your Clerk, Neon, Pusher, and OpenRouter values to `.env.local`.

### 3. Apply database migrations

```bash
npm run db:migrate
```

### 4. Seed organization metrics

```bash
npm run db:seed -- --org-id=org_your_clerk_org_id
```

### 5. Start the application

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Environment Variables

See [`.env.example`](./.env.example) for the complete list.

Required services:

- Clerk application with Organizations enabled
- Neon PostgreSQL database
- Pusher Channels application
- OpenRouter API key

Optional public demo configuration:

```env
DEMO_USER_ID=user_xxx
DEMO_EMAIL=demo@example.com
```

The demo user should remain an organization member, not an administrator.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Create production build
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
npm test             # Run tests
npm run db:generate  # Generate Drizzle migration
npm run db:migrate   # Apply migrations
npm run db:seed      # Seed organization metrics
```

## Project Status

Authentication, analytics, real-time activity, AI chat, team management, settings, deployment, and public demo access are implemented.

See [`Progress.MD`](./Progress.MD) for the full development handoff and planned improvements.
