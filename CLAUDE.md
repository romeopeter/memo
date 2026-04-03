# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Writestream** is an Electron + React desktop SaaS application for professional writers and content entrepreneurs. The app enables writers to create content once and publish to multiple platforms (Medium, Substack, LinkedIn, Twitter/X, Ghost).

**Core Domains:**
- **Write** - Rich-text/markdown editor with autosave, word count, focus mode
- **Publish** - Cross-publish to multiple platforms with per-platform metadata
- **Repurpose** - Transform content between formats (blog → thread, blog → newsletter)
- **Measure** - Aggregated analytics dashboard from platform APIs

## Tech Stack

- **Frontend**: React 19 + TypeScript + React Router v7 + TailwindCSS v4
- **Desktop Framework**: Electron 33 with Electron Forge
- **Build Tool**: Vite 5
- **UI Components**: Radix UI primitives (shadcn/ui pattern)
- **Editor**: QuillJS
- **Styling**: TailwindCSS 4 with class-variance-authority

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Lint the codebase
npm run lint

# Package the application (without creating distributables)
npm run package

# Build distributables (DMG, EXE, DEB, RPM based on platform)
npm run make

# Publish to GitHub releases (requires GITHUB_TOKEN env var)
npm run publish
```

## Architecture

### Process Architecture

Writestream follows Electron's multi-process architecture:

```
┌─────────────────────────────────────────────────────────────┐
│  Main Process (Node.js)                                     │
│  Entry: electron/main.ts                                    │
│  - Window management                                        │
│  - IPC handlers (electron/ipc/)                            │
│  - File system operations                                   │
│  - OAuth flows (future)                                     │
│  - Platform API integrations (future)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ IPC (Inter-Process Communication)
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Preload Script (electron/preload.ts)                       │
│  - contextBridge: Safe API exposure to renderer            │
│  - Type definitions exported for renderer                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ window.electron API
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Renderer Process (React)                                   │
│  Entry: src/main.tsx                                        │
│  - React application (browser-like environment)            │
│  - Feature modules (src/features/)                         │
│  - Shared components (src/components/)                     │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
writestream/
├── electron/              # Main process (Node.js world)
│   ├── main.ts           # App entry, window creation, IPC setup
│   ├── preload.ts        # contextBridge - safe API exposure
│   ├── ipc/              # IPC channel handlers
│   │   └── ipc-calls.ts  # Current: file operations (save/open)
│   └── services/         # Future: auth, publishing, analytics
│
├── src/                  # Renderer process (React world)
│   ├── main.tsx          # React entry point with routing
│   ├── writestream.tsx   # Root app component
│   │
│   ├── features/         # Feature slices (domain-driven)
│   │   └── write/        # Editor experience
│   │       └── editor.tsx
│   │
│   ├── components/       # Shared UI components
│   │   ├── shadcn/       # Radix UI primitives (Button, etc.)
│   │   └── layout/       # AppShell, Sidebar, TopBar
│   │
│   ├── hooks/            # Cross-feature React hooks
│   ├── lib/              # Pure renderer utilities
│   └── styles/
│       └── globals.css   # TailwindCSS imports
│
├── shared/               # Code shared between main & renderer
│   └── types/
│       └── app-types.d.ts  # Global Window.electron type definitions
│
└── Config files:
    ├── forge.config.ts      # Electron Forge packaging config
    ├── vite.main.config.ts
    ├── vite.preload.config.ts
    ├── vite.renderer.config.ts
    └── tsconfig.json
```

### Module Boundaries

| Layer | Can import from | Cannot import from |
|-------|----------------|-------------------|
| `electron/` | `shared/` | `src/` |
| `src/` | `shared/` | `electron/` |
| `shared/` | Nothing internal | `electron/` or `src/` |

**IPC Communication:**
- Main → Renderer: Via `ipcRenderer.on()` listeners set up in preload
- Renderer → Main: Via `window.electron.*` methods (uses `ipcRenderer.invoke()`)
- All IPC APIs must be exposed through `preload.ts` using `contextBridge`

### Path Aliases

TypeScript path aliases are configured in `tsconfig.json`:

```typescript
"@/*": ["./src"]
"@components/*": ["./src/components/*"]
"@lib/*": ["./src/lib/*"]
"@utils/*": ["./src/lib/utils/*"]
```

## Key Patterns

### Adding IPC Functionality

When adding new main process capabilities:

1. **Define the handler** in `electron/ipc/ipc-calls.ts`:
   ```typescript
   ipcMain.handle("channel-name", async (_, arg1, arg2) => {
     // Implementation
     return result;
   });
   ```

2. **Expose in preload** (`electron/preload.ts`):
   ```typescript
   const electronAPI = {
     methodName: (arg1, arg2) => ipcRenderer.invoke("channel-name", arg1, arg2)
   };
   ```

3. **Add type definition** in `shared/types/app-types.d.ts`:
   ```typescript
   interface Window {
     electron: {
       methodName: (arg1: Type1, arg2: Type2) => Promise<ResultType>;
     };
   }
   ```

4. **Use in renderer** (`src/`):
   ```typescript
   const result = await window.electron.methodName(arg1, arg2);
   ```

### Current IPC APIs

### File Operations
- `window.electron.saveFile(filePath, content)` - Save markdown file
- `window.electron.openFile()` - Open file picker and read content
- `window.electron.newFile()` - Create new file

### Authentication (OAuth)
- `window.electron.auth.startOAuth(platformId)` - Start OAuth flow for a platform
- `window.electron.auth.saveToken(platformId, token)` - Save API token manually (Medium)
- `window.electron.auth.getConnectedPlatforms()` - Get list of connected platforms
- `window.electron.auth.disconnectPlatform(platformId)` - Remove platform connection
- `window.electron.auth.isConnected(platformId)` - Check connection status

### Publishing
- `window.electron.publish.toPlatform(platformId, content)` - Publish to one platform
- `window.electron.publish.toMultiple(platformIds, content)` - Publish to multiple platforms

### Routing

The app uses React Router v7 with HashRouter (required for Electron):

```typescript
// In src/main.tsx
<HashRouter>
  <Routes>
    <Route path="/" element={<WriteStream />} />
    <Route path="/writer" element={<Editor />} />
  </Routes>
</HashRouter>
```

Navigate using `react-router-dom` hooks:
```typescript
const navigate = useNavigate();
navigate("/writer");
```

## Build Configuration

### Electron Forge Setup

- **Makers**: Configured for Squirrel (Windows), ZIP (macOS), DEB, and RPM
- **Executable name**: `memo` (configurable in `forge.config.ts`)
- **Publisher**: GitHub releases (requires `GITHUB_TOKEN` in env)
- **Vite Plugin**: Separate configs for main, preload, and renderer

### Vite Configuration

Three separate Vite configs:
- `vite.main.config.ts` - Main process bundling
- `vite.preload.config.ts` - Preload script bundling
- `vite.renderer.config.ts` - React app bundling

## OAuth & Publishing Architecture

Writestream implements a **pluggable OAuth system** for publishing to multiple platforms.

### Implemented Platforms

- **Medium** - Token-based auth (user provides integration token)
- **LinkedIn** - OAuth 2.0 with authorization code flow
- **Twitter/X** - OAuth 2.0 with PKCE (enhanced security for desktop apps)

### Architecture Layers

1. **Platform Registry** (`shared/constants/platforms.ts`)
   - Central configuration for all platforms
   - OAuth URLs, API endpoints, client credentials (via .env)

2. **OAuth Service** (`electron/services/auth/oauth.service.ts`)
   - Handles OAuth flows (standard and PKCE)
   - Opens browser, exchanges codes for tokens, refreshes tokens

3. **Token Storage** (`electron/services/auth/token-store.ts`)
   - Encrypted SQLite database with AES-256-GCM
   - **Requires**: `npm install better-sqlite3` (currently mocked)

4. **Publishers** (`electron/services/publish/*.publisher.ts`)
   - Platform-specific publishing logic
   - Extend `BasePublisher` interface
   - Handle API-specific formatting and constraints

5. **IPC Handlers** (`electron/ipc/auth.ipc.ts`, `electron/ipc/publish.ipc.ts`)
   - Bridge between renderer and main process
   - Exposed via preload.ts

### Adding New Platforms

To add a new platform (e.g., Reddit):

1. Add platform ID to `PlatformId` type in `shared/types/platform.types.ts`
2. Add platform config to `shared/constants/platforms.ts`
3. Create publisher class in `electron/services/publish/<platform>.publisher.ts`
4. Register publisher in `electron/ipc/auth.ipc.ts` and `electron/ipc/publish.ipc.ts`

See `OAUTH_SETUP.md` for detailed guide.

### OAuth Callback Flow

```
User clicks "Connect" → startOAuth() → Browser opens → User authorizes
→ Platform redirects to writestream://auth/callback?code=...
→ Protocol handler in main.ts intercepts → Exchange code for token
→ Token stored encrypted → Platform connected
```

Custom protocol `writestream://` is registered in `electron/main.ts`.

### Environment Variables

Create `.env` file:
```
LINKEDIN_CLIENT_ID=your_id
LINKEDIN_CLIENT_SECRET=your_secret
TWITTER_CLIENT_ID=your_id
```

## Development Notes

### Current State

The project is in active development:
- Basic Electron + React shell is configured
- File operations (save/open) work via IPC
- **OAuth infrastructure implemented** for Medium, LinkedIn, Twitter/X
- Editor component exists but implementation is minimal
- Feature structure is scaffolded but incomplete

### TODO Before Production

- [ ] Install `better-sqlite3` and uncomment database code in `token-store.ts`
- [ ] Obtain OAuth credentials for each platform
- [ ] Implement UI for platform connections in `src/features/publish/`
- [ ] Add token refresh logic on expired tokens
- [ ] Test OAuth flows on all platforms

### Security

- Node.js integration is **disabled** in renderer (security best practice)
- All main process APIs must go through `contextBridge` in preload
- Preload script validates and sanitizes IPC communication
- OAuth tokens encrypted with AES-256-GCM before storage
- Encryption key stored with restricted permissions (0o600)

## Future Architecture (Planned)

According to `.claude/skills/writestream-skills/PROJECT-STRUCTURE.md`, the planned architecture includes:

- **Services layer** (`electron/services/`):
  - `auth/` - OAuth2 flows, token storage
  - `publish/` - Publisher implementations per platform
  - `storage/` - SQLite database, file exports
  - `analytics/` - Platform API aggregation

- **Feature modules** (`src/features/`):
  - `write/` - Editor, toolbar, autosave
  - `publish/` - Platform selector, publish settings
  - `repurpose/` - Content transformation studio
  - `measure/` - Analytics dashboard

- **State management**: Zustand or Redux slices per feature
- **Local database**: SQLite via better-sqlite3
- **Authentication**: Platform-specific OAuth flows with secure token storage (keytar)

## Reference Documentation

- Electron Forge docs: https://www.electronforge.io/
- Electron security: https://electronjs.org/docs/tutorial/security
- React Router v7: https://reactrouter.com/
- Detailed project structure: `.claude/skills/writestream-skills/PROJECT-STRUCTURE.md`
