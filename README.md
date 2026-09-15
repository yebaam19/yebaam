# Yebaam

A social platform for connecting people through posts, stories, chat, cities, communities, blogs, businesses, professional services, live streaming, and more.

## Tech Stack

- **Framework:** Next.js 16 (App Router and Turbopack)
- **Language:** TypeScript and React 19
- **Styling:** Tailwind CSS 4
- **Backend:** Supabase (Postgres, Auth, RLS, Realtime, and Edge Functions)
- **Media:** Cloudflare Images, Stream, and R2
- **Monitoring:** Sentry and Vercel Analytics
- **Tests:** Vitest and Testing Library
- **Package manager:** pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Installation

```bash
pnpm install
```

### Environment Setup

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm start
```

## Features

- Authentication (register, email verification, login)
- User profiles with media galleries
- Posts & feed with images and videos
- Stories (24h ephemeral content)
- Comments & reactions
- Friends & follow system
- Real-time chat with optional encryption
- Blogs & long-form content
- Business directory
- Brand pages
- Community groups & clubs
- Professional profiles & services
- Live streaming
- Full-text search
- Notifications (in-app + real-time)

## Project Structure

```
src/
├── app/                 # App Router pages and API route handlers
├── features/            # Feature modules
├── components/          # Shared UI components
├── lib/                 # Cross-cutting helpers and services
└── utils/supabase/      # Approved Supabase client wrappers
supabase/
├── functions/           # Supabase Edge Functions
└── migrations/          # Database migrations
```

## Project Instructions

See [AGENTS.md](AGENTS.md) for the authoritative architecture, security, media, governance, and contribution rules.

## License

Private — All rights reserved.
