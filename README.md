# Yebaam

A social media platform built with Next.js, connecting people through posts, stories, blogs, businesses, live streaming, and more.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** InsForge
- **Real-time:** Socket.IO
- **Package Manager:** pnpm

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
├── app/          # Next.js App Router pages
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── lib/          # Utilities and helpers
└── images/       # Static image assets
```

## Backend Migration

See [PDR.md](PDR.md) for the full backend migration plan to InsForge.

## License

Private — All rights reserved.
