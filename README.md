# MineAPP

A modern web application template built with **SolidJS**, **Vite**, **TailwindCSS**, and **TypeScript**.

Extracted from a production-grade mobile-first architecture, this template provides battle-tested infrastructure while remaining clean and extensible.

## Quick Start

```bash
# Install dependencies
yarn install

# Start dev server
yarn dev

# Build for production
yarn build

# Build workers (after editing public/worker/*.js)
yarn zip-worker
```

## Architecture

```
src/
├── app/              # Application singleton (auth, locale, state)
├── common/           # Shared utilities (event bus, math, logging, etc.)
├── components/       # Base UI components (Button, Spin, Image, tips, popups, loading)
├── config/           # App configuration (constants, env detection, server URLs)
├── directives/       # SolidJS directives (model - two-way binding)
├── features/         # Feature modules
│   ├── dateFormat    # Date formatting setup
│   ├── i18n/         # Internationalization (@solid-primitives/i18n)
│   ├── keepAlive/    # Route-level component caching (LRU)
│   ├── loadMore/     # Infinite scroll / pagination hook
│   └── pageTransition/ # Forward navigation animations
├── hooks/            # Reusable hooks (useRequest, useTimer, useBoolean, etc.)
├── pages/            # File-system routes (@generouted/solid-router)
├── provider/         # Context providers
│   ├── ScopedPage    # Page lifecycle: scoped requests, toasts, popups, timers
│   ├── Touchable     # Cross-platform tap/hold handler
│   ├── Scroller      # Infinite scroll container with scroll restoration
│   └── Default       # Fallback content renderer
├── store/            # SolidJS store with useSelector / createScopedActions
├── style/            # Global styles (TailwindCSS, animations, CSS vars)
└── tools/            # Request layer, mock system, utilities
    ├── request/      # get/post factories, Web Worker HTTP, axios fallback
    ├── mock/         # Mock API definitions for development
    └── once.ts       # Reactive one-shot callback

lunzi/                # Local utility library
├── event             # Typed event emitter with namespaces & wildcards
├── stateFetch        # Priority queue HTTP with cancellation & caching
├── stateQueue        # Async task queue
├── store             # Reactive store helpers
└── ...               # localStorage/session wrappers, logging, etc.

public/
├── lang/             # i18n JSON dictionaries
└── worker/           # Web Worker scripts (fetch.js)
```

## Key Concepts

### ScopedPage

Every page should be wrapped in `ScopedPage`. It provides scoped lifecycle management — all requests, toasts, popups, and timers are automatically cancelled on page unmount.

```tsx
import ScopedPage from '@/provider/ScopedPage'
import { AUTH_SCOPE } from '@/config'
import { usePageContext } from '@/hooks/usePageContext'

export default function MyPage() {
  const { request, toast, popup, interval, delay, on, emit } = usePageContext()

  // request() wraps API calls with loading signal and auto-cancellation
  const [fetchData, loading] = request(myApiCall)

  return (
    <ScopedPage scope={AUTH_SCOPE.PUBLIC}>
      {/* page content */}
    </ScopedPage>
  )
}
```

### Request Layer

API calls are defined as typed factories. HTTP runs off-thread in a Web Worker with priority queue support.

```ts
// Define API
import { get, post } from '@/tools/request'
export const fetchUsers = get<User[]>('/api/users')
export const createUser = post<User, CreateUserParams>('/api/users')

// Use in page
const { request } = usePageContext()
const [doFetch, loading] = request(fetchUsers)
const users = await doFetch()
```

### State Management

```ts
import { useSelector, createScopedActions } from '@/store'

// Read (reactive)
const userName = useSelector(s => s.user.name)

// Define actions
const userActions = createScopedActions('user', {
  setName(set, name: string) { set('name', name) }
})

// Dispatch
userActions.setName('Alice')
```

### i18n

```ts
import { t, te } from '@/features/i18n'
t('app.title')                    // translated string
t('greeting', { name: 'World' }) // with interpolation
te('some.key')                    // existence check
```

### Routing

File-system based routing via `@generouted/solid-router`:
- `src/pages/index.tsx` → `/`
- `src/pages/about.tsx` → `/about`
- `src/pages/users/[id].tsx` → `/users/:id`
- `src/pages/_app.tsx` → App wrapper (layout)

## Adding a New Module

1. Create page at `src/pages/my-feature.tsx`
2. Define APIs in a `*.api.ts` file
3. Add store slice in `src/store/index.ts` if needed
4. Wrap page in `<ScopedPage>` for lifecycle management
5. Add i18n keys to `public/lang/*.json`

## Configuration

| File | Purpose |
|---|---|
| `src/config/static.ts` | Runtime env detection, platform flags |
| `src/config/const.ts` | App enums, storage keys, events |
| `src/config/server.env.ts` | API base URLs per environment |
| `src/config/numbers.ts` | Numeric constants |
| `env/.env` | Vite environment variables |

## Scripts

| Command | Description |
|---|---|
| `yarn dev` | Dev server with HMR |
| `yarn build` | Production build |
| `yarn zip-worker` | Minify Web Worker scripts |
| `yarn lint` | Run ESLint |
| `yarn lint:fix` | Auto-fix ESLint issues |
| `yarn preview` | Preview production build |

## Tech Stack

- **SolidJS** ^1.9 — Reactive UI framework
- **Vite** ^6.0 — Build tool
- **TailwindCSS** ^3.4 — Utility-first CSS
- **TypeScript** ^5.7 — Type safety
- **@generouted/solid-router** — File-system routing
- **@solid-primitives/i18n** — Internationalization
- **lunzi** — Local utility library (event bus, stateFetch, stateQueue)
