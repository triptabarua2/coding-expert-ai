# Coding Expert AI

An AI-powered coding assistant with bilingual support (English + Bengali). Built with React, Express, tRPC, and Gemini 2.5 Flash.

## Features

- **Multi-turn chat** — full conversation history sent to the LLM on each message
- **Streaming responses** — token-by-token output via Server-Sent Events
- **Syntax highlighting** — code blocks highlighted with highlight.js
- **File upload** — attach code files (.js, .py, .ts, .java, etc.) for review
- **Conversation search** — filter sidebar by title
- **Message copy** — copy any AI response to clipboard
- **Dark / Light mode** — persisted in localStorage
- **Export** — download conversation as Markdown
- **LLM topic guard** — non-coding questions are rejected by the LLM itself
- **OAuth** — Google and GitHub login (Manus OAuth kept for backward compat)
- **Bilingual** — UI and AI responses in English or Bengali

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui |
| Backend | Express, tRPC v11 |
| Database | MySQL via Drizzle ORM |
| AI | Gemini 2.5 Flash (OpenAI-compatible API) |
| Auth | Google OAuth, GitHub OAuth, JWT session cookies |

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

### 3. Run database migrations

```bash
pnpm db:push
```

### 4. Start development server

```bash
pnpm dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | MySQL connection string, e.g. `mysql://user:pass@host:3306/dbname` |
| `JWT_SECRET` | ✅ | Secret used to sign session cookies (any long random string) |
| `BUILT_IN_FORGE_API_KEY` | ✅ | API key for the Gemini / Forge LLM endpoint |
| `BUILT_IN_FORGE_API_URL` | ✅ | Base URL for the LLM API (e.g. `https://forge.manus.im`) |
| `GOOGLE_CLIENT_ID` | ⚠️ | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | ⚠️ | Google OAuth app client secret |
| `GITHUB_CLIENT_ID` | ⚠️ | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | ⚠️ | GitHub OAuth app client secret |
| `VITE_APP_ID` | optional | App ID (used by legacy Manus OAuth) |
| `OAUTH_SERVER_URL` | optional | Manus OAuth server URL (legacy) |
| `OWNER_OPEN_ID` | optional | openId of the admin user |
| `PORT` | optional | HTTP port (default: `3000`) |

> ⚠️ At least one OAuth provider (Google **or** GitHub) must be configured for login to work.

### Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:3000/api/oauth/google/callback` to Authorized redirect URIs
4. Copy the Client ID and Secret into `.env`

### Setting up GitHub OAuth

1. Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Set Authorization callback URL to `http://localhost:3000/api/oauth/github/callback`
3. Copy the Client ID and Secret into `.env`

## Project Structure

```
├── client/          # React frontend (Vite)
│   └── src/
│       ├── components/   # UI components
│       ├── contexts/     # React contexts (Theme, Language)
│       ├── hooks/        # Custom hooks (streaming, translation)
│       └── pages/        # Route pages
├── server/          # Express backend
│   ├── _core/       # Auth, LLM, OAuth, tRPC setup
│   ├── db.ts        # Database queries
│   ├── routers.ts   # tRPC router
│   ├── streaming.ts # SSE streaming endpoint
│   └── topicClassifier.ts  # LLM-based topic guard
├── shared/          # Shared types, i18n, system prompts
└── drizzle/         # DB schema and migrations
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Run production build |
| `pnpm test` | Run tests |
| `pnpm db:push` | Generate and run DB migrations |
| `pnpm check` | TypeScript type check |
