---
name: writestream-structure
description: >
  Use this skill whenever working on the Writestream project — a SaaS desktop app for professional
  writers and content entrepreneurs, built with Electron and React. Trigger this skill when the user
  asks about adding new features, creating files, scaffolding modules, understanding the codebase,
  onboarding into the project, or making architectural decisions for Writestream. This skill defines
  the canonical source structure, naming conventions, module boundaries, and agent navigation rules.
  Use it even for partial tasks like "add a new publisher" or "where should I put the analytics
  hook?" — any Writestream code question benefits from consulting this structure guide.
---

# Writestream — Project Structure Skill

Writestream is an Electron + React desktop SaaS for professional writers and content entrepreneurs.
It covers four core domains: **Write**, **Publish**, **Repurpose**, and **Measure** (aggregated analytics).

Think of the source tree like a city:
- `main/` is the city hall — Electron's Node.js backend, handles OS-level power (file system, auth tokens, window control).
- `renderer/` is the downtown — everything the writer sees and touches, built in React.
- `shared/` is the road network — types, constants, and utilities used by both sides equally.
- `preload/` is the border crossing — the secure bridge between city hall and downtown (contextBridge).

---

## Canonical Source Tree

```
writestream/
├── electron/                        # Electron main process (Node.js world)
│   ├── main.ts                      # App entry point — creates BrowserWindow, registers IPC
│   ├── preload.ts                   # contextBridge — exposes safe APIs to renderer
│   ├── ipc/                         # IPC channel handlers (one file per domain)
│   │   ├── auth.ipc.ts
│   │   ├── publish.ipc.ts
│   │   ├── storage.ipc.ts
│   │   └── analytics.ipc.ts
│   ├── services/                    # Node-side business logic (filesystem, OAuth, APIs)
│   │   ├── auth/
│   │   │   ├── oauth.service.ts     # OAuth2 flows (Medium, Substack, LinkedIn, etc.)
│   │   │   └── token-store.ts       # Secure token persistence (keytar)
│   │   ├── publish/
│   │   │   ├── publisher.interface.ts
│   │   │   ├── medium.publisher.ts
│   │   │   ├── substack.publisher.ts
│   │   │   ├── linkedin.publisher.ts
│   │   │   ├── twitter/x.publisher.ts
│   │   │   └── ghost.publisher.ts
│   │   ├── storage/
│   │   │   ├── local-db.service.ts  # SQLite via better-sqlite3
│   │   │   └── file-export.service.ts
│   │   └── analytics/
│   │       └── aggregator.service.ts # Pulls stats from platform APIs
│   └── utils/
│       └── logger.ts
│
├── src/                             # React renderer (browser-like world)
│   ├── main.tsx                     # React DOM entry — mounts <App />
│   ├── App.tsx                      # Root layout, router, theme provider
│   │
│   ├── features/                    # Feature slices — one folder per domain
│   │   │
│   │   ├── write/                   # ✍️  The editor experience
│   │   │   ├── components/
│   │   │   │   ├── Editor.tsx       # Rich-text / markdown editor (QuillJS)
│   │   │   │   ├── Toolbar.tsx
│   │   │   │   ├── WordCount.tsx
│   │   │   │   └── FocusMode.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAutoSave.ts
│   │   │   │   └── useEditorState.ts
│   │   │   ├── store/
│   │   │   │   └── editor.slice.ts  # Zustand or Redux slice
│   │   │   └── index.ts
│   │   │
│   │   ├── publish/                 # 🚀  Cross-publishing workflow
│   │   │   ├── components/
│   │   │   │   ├── PublishPanel.tsx
│   │   │   │   ├── PlatformSelector.tsx
│   │   │   │   ├── PublishSettings.tsx  # Per-platform metadata (tags, canonical URL)
│   │   │   │   └── PublishHistory.tsx
│   │   │   ├── hooks/
│   │   │   │   └── usePublish.ts
│   │   │   ├── store/
│   │   │   │   └── publish.slice.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── repurpose/               # ♻️  Content transformation & reuse
│   │   │   ├── components/
│   │   │   │   ├── RepurposeStudio.tsx
│   │   │   │   ├── FormatPicker.tsx     # Blog → Thread, Blog → Newsletter, etc.
│   │   │   │   ├── SnippetLibrary.tsx
│   │   │   │   └── RepurposePreview.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useRepurpose.ts
│   │   │   ├── store/
│   │   │   │   └── repurpose.slice.ts
│   │   │   └── index.ts
│   │   │
│   │   └── measure/                 # 📊  Analytics & insight dashboard
│   │       ├── components/
│   │       │   ├── Dashboard.tsx
│   │       │   ├── PerformanceChart.tsx
│   │       │   ├── TopContentTable.tsx
│   │       │   └── InsightCard.tsx
│   │       ├── hooks/
│   │       │   └── useMeasure.ts
│   │       ├── store/
│   │       │   └── measure.slice.ts
│   │       └── index.ts
│   │
│   ├── components/                  # Shared UI components (design system)
│   │   ├── ui(shadcn)/                      # Primitives (Button, Input, Modal, Tooltip…)
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # Sidebar + main content area
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   └── feedback/
│   │       ├── Toast.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── hooks/                       # Global / cross-feature hooks
│   │   ├── useIpc.ts                # Typed wrapper around window.electronAPI
│   │   ├── useAuth.ts
│   │   └── useTheme.ts
│   │
│   ├── store/                       # Global state
│   │   ├── index.ts                 # Store configuration
│   │   └── root.reducer.ts
│   │
│   ├── router/
│   │   └── routes.tsx               # React Router v6 route definitions
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   ├── tokens.css               # Design tokens (colors, spacing, type)
│   │   └── themes/
│   │       ├── light.css
│   │       └── dark.css
│   │
│   └── lib/                         # Pure renderer-side utilities
│       ├── format.ts                # Date / number formatters
│       └── content-parser.ts        # Markdown ↔ HTML helpers
│
├── shared/                          # Zero-dependency code shared by both worlds
│   ├── types/
│   │   ├── content.types.ts         # Article, Draft, Snippet, Format
│   │   ├── platform.types.ts        # Platform, PublishStatus, PublishResult
│   │   ├── analytics.types.ts       # Metric, InsightSummary
│   │   └── ipc.types.ts             # IPC channel names + payload shapes
│   ├── constants/
│   │   ├── platforms.ts             # Supported platforms registry
│   │   └── formats.ts               # Repurpose format definitions
│   └── utils/
│       ├── slug.ts
│       └── word-count.ts
│
├── assets/                          # Static assets bundled by Electron
│   ├── icons/
│   │   └── app-icon.png
│   └── fonts/
│
├── tests/
│   ├── unit/                        # Jest unit tests — mirrors src/ structure
│   ├── integration/                 # Cross-process IPC integration tests
│   └── e2e/                         # Playwright / Spectron end-to-end tests
│
├── scripts/                         # Dev tooling & CI scripts
│   ├── build.ts
│   └── generate-types.ts
│
├── electron-builder.config.ts       # Packaging config (dmg, exe, deb)
├── vite.config.ts                   # Renderer bundler config
├── tsconfig.json                    # Root TS config
├── tsconfig.main.json               # Electron main overrides
├── package.json
└── .env.example                     # Environment variable template
```

---

## Module Boundaries — The Rules of the Road

| Layer | Can import from | Cannot import from |
|---|---|---|
| `electron/` | `shared/` | `src/` directly |
| `src/` (renderer) | `shared/` | `electron/` directly |
| `shared/` | nothing internal | `electron/` or `src/` |
| `electron/ipc/` | `electron/services/` | other ipc files |
| `src/features/X/` | `src/components/`, `src/hooks/`, `shared/` | `src/features/Y/` directly |

> **Analogy:** The `shared/` layer is like a public library — anyone can borrow from it, but no one
> lives there. The IPC layer is like a telephone operator: it takes calls from downtown (renderer),
> routes them to city hall (services), and sends back the result. Neither side should bypass it.

---

## Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| React components | PascalCase `.tsx` | `PublishPanel.tsx` |
| Hooks | camelCase, `use` prefix | `useAutoSave.ts` |
| Services (main) | camelCase, `.service.ts` suffix | `oauth.service.ts` |
| IPC handlers | camelCase, `.ipc.ts` suffix | `publish.ipc.ts` |
| Zustand/Redux slices | camelCase, `.slice.ts` suffix | `editor.slice.ts` |
| Types file | camelCase, `.types.ts` suffix | `content.types.ts` |
| Constants file | camelCase | `platforms.ts` |

---

## Adding a New Publisher (Step-by-Step)

When the user says "add a new platform" (e.g. Dev.to):

1. Add the platform entry to `shared/constants/platforms.ts`
2. Add platform-specific types to `shared/types/platform.types.ts`
3. Create `electron/services/publish/devto.publisher.ts` implementing `publisher.interface.ts`
4. Register the IPC handler in `electron/ipc/publish.ipc.ts`
5. Update `preload.ts` if a new channel is exposed
6. Add a platform card to `src/features/publish/components/PlatformSelector.tsx`
7. Write a unit test in `tests/unit/services/devto.publisher.test.ts`

---

## Adding a New Repurpose Format

1. Register the format in `shared/constants/formats.ts`
2. Add transform logic in `src/features/repurpose/hooks/useRepurpose.ts` (or a sibling util)
3. Update `FormatPicker.tsx` to display the new option
4. Add a preview renderer in `RepurposePreview.tsx`

---

## IPC Communication Pattern

```
Renderer                         Preload (bridge)                   Main
   │                                    │                              │
   │── window.electronAPI.publish() ───▶│── ipcRenderer.invoke() ────▶│
   │                                    │                              │── publish.ipc.ts
   │                                    │                              │── publisher.service.ts
   │◀─────────────── PublishResult ─────│◀─── ipcMain.handle() ───────│
```

All channel names are typed constants in `shared/types/ipc.types.ts`.
Never use raw strings for IPC channels.

---

## Early-Stage Conventions (Pre-1.0)

- Prefer **feature flags** (simple env var booleans) over branching for unfinished features.
- Keep all platform OAuth credentials in `.env` — never hardcode.
- Analytics aggregation is pull-based at startup and on-demand — no background polling yet.
- The SQLite local DB is the source of truth; platform APIs are read/write endpoints only.

---

## Quick Reference: Where Does X Live?

| Question | Answer |
|---|---|
| Where do I add a new React page/view? | `src/features/<domain>/components/` |
| Where does a platform API call go? | `electron/services/publish/<platform>.publisher.ts` |
| Where do I define a shared TypeScript type? | `shared/types/` |
| Where do I add a global UI component? | `src/components/ui/` |
| Where do I store app state? | `src/features/<domain>/store/<domain>.slice.ts` |
| Where do I write a hook that calls Electron? | `src/hooks/useIpc.ts` or a feature-level hook |
| Where does OAuth live? | `electron/services/auth/oauth.service.ts` |
| Where do I put a test for a service? | `tests/unit/services/` |