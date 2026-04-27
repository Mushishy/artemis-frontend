## Project Structure

**Tech Stack:**
- **Framework:** SvelteKit with Svelte 5
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **UI Components:** shadcn-svelte (bits-ui)
- **Authentication:** JWT with encrypted API keys
- **HTTP Client:** Axios
- **Adapter:** Node.js

---

```
artemis-frontend/
├── docs/                             # Documentation files
│   ├── components.md                 # System architecture & auth flow
│   ├── costructure.md                # This file - codebase structure
│   └── img/                          # Documentation images
│
├── src/                              # Source code
│   ├── lib/                          # Shared libraries and utilities
│   │   ├── api/                      # API communication layer
│   │   │   ├── client/               # Client-side API calls (browser)
│   │   │   ├── server/               # Server-side API calls (SSR)
│   │   │   ├── settings/             # API configuration & proxies
│   │   │   └── types.ts              # TypeScript type definitions
│   │   │
│   │   ├── components/               # Reusable Svelte components
│   │   │   ├── app-sidebar.svelte    # Main navigation sidebar
│   │   │   ├── AuthLogin.svelte      # Login component
│   │   │   ├── pool/                 # Pool management dialogs
│   │   │   │   ├── AccessDialog.svelte
│   │   │   │   ├── PowerDialog.svelte
│   │   │   │   ├── SharePoolDialog.svelte
│   │   │   │   ├── SharingDialog.svelte
│   │   │   │   ├── StatusDialog.svelte
│   │   │   │   ├── StatusTabs.svelte
│   │   │   │   ├── TestingDialog.svelte
│   │   │   │   ├── TopologyDialog.svelte
│   │   │   │   └── UsersDialog.svelte
│   │   │   └── ui/                   # shadcn-svelte UI primitives
│   │   │       ├── alert/
│   │   │       ├── alert-dialog/
│   │   │       ├── badge/
│   │   │       ├── button/
│   │   │       ├── calendar/
│   │   │       ├── card/
│   │   │       ├── combobox/
│   │   │       ├── command/
│   │   │       ├── data-table/
│   │   │       ├── dialog/
│   │   │       ├── input/
│   │   │       ├── label/
│   │   │       ├── popover/
│   │   │       ├── select/
│   │   │       ├── separator/
│   │   │       ├── sheet/
│   │   │       ├── sidebar/
│   │   │       ├── skeleton/
│   │   │       ├── table/
│   │   │       └── tooltip/
│   │   │
│   │   ├── hooks/                    # Svelte 5 runes and reactive hooks
│   │   │   └── is-mobile.svelte.ts   # Mobile detection - the app is not responsive
│   │   │
│   │   ├── stores/                   # Global state management
│   │   │   └── auth.ts               # Authentication state & login/logout
│   │   │
│   │   ├── utils/                    # Utility functions
│   │   │   ├── auth-guard.ts         # Server-side auth middleware
│   │   │   ├── file-conversion.ts    # File format conversions
│   │   │   ├── helper.ts             # General helper functions
│   │   │   ├── jwt-auth.ts           # JWT token operations
│   │   │   ├── pool-handlers.ts      # Pool action handlers
│   │   │   └── timezones.ts          # Timezone utilities
│   │   │
│   │   └── utils.ts                  # Tailwind utility merger (cn)
│   │
│   ├── routes/                       # SvelteKit file-based routing
│   │   ├── +layout.svelte            # Root layout with auth & sidebar
│   │   ├── +page.server.ts           # Home page server logic
│   │   ├── +page.svelte              # Home page component
│   │   │
│   │   ├── api/                      # API endpoints
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   │   ├── login/            # POST /api/auth/login
│   │   │   │   ├── logout/           # POST /api/auth/logout
│   │   │   │   └── validate/         # GET /api/auth/validate
│   │   │   │
│   │   │   └── proxy/                # Backend proxy endpoints
│   │   │       ├── dulus/            # Dulus API proxy
│   │   │       ├── ludus/            # Ludus API proxy
│   │   │       └── ludus-admin/      # Ludus Admin API proxy
│   │   │
│   │   ├── create/                   # Pool creation page
│   │   ├── ctfd/                     # CTFd integration page
│   │   ├── pool/[poolId]/            # Individual pool management
│   │   │   ├── +page.server.ts  
│   │   │   ├── +page.svelte          # Pool details & actions
│   │   │   ├── logs/                 # Pool log viewer
│   │   │   └── user/                 # User-specific pool view
│   │   │
│   │   ├── pools/                    # All pools dashboard
│   │   ├── roles/                    # User roles management
│   │   ├── scenarios/                # Scenario configuration
│   │   ├── templates/                # VM template management
│   │   ├── topologies/               # Topology definitions
│   │   └── users/                    # User management
│   │
│   ├── app.css                       # Global styles & Tailwind imports
│   ├── app.d.ts                      # TypeScript ambient declarations
│   └── app.html                      # HTML template
│
├── static/                           # Static assets (served directly)
│
├── artemis-frontend.service          # Systemd service definition
├── components.json                   # shadcn-svelte configuration
├── nginx.conf                        # Nginx reverse proxy config
├── package.json                      # NPM dependencies & scripts
├── README.md                         # Project overview & setup
├── svelte.config.js                  # SvelteKit configuration
├── tsconfig.json                     # TypeScript configuration
└── vite.config.ts                    # Vite build configuration
```

---

## Core Directories

### `/src/lib/api`
**Purpose:** Centralized API communication layer

- **`client/`** - Browser-side API calls using fetch/axios
  - `ctfd.client.ts` - CTFd integration
  - `pools.client.ts` - Pool operations
  - `roles.client.ts` - Role management
  - `topology.client.ts` - Topology operations
  - `users.client.ts` - User operations

- **`server/`** - Server-side API calls (SSR & API routes)
  - `ctfd.server.ts` - Server-side CTFd calls
  - `pools.server.ts` - Server pool operations
  - `proxmox.server.ts` - Proxmox statistics
  - `roles.server.ts` - Server role operations
  - `topology.server.ts` - Server topology operations
  - `users.server.ts` - Server user operations

- **`settings/`** - API configuration
  - `api-client.ts` - Client-side API base URL
  - `proxy.ts` - Proxy configuration helpers
  - `server-api-client.ts` - Server-side API client
  - `settings-client.ts` - Client settings
  - `settings-server.ts` - Server settings

- **`types.ts`** - Shared TypeScript interfaces for API data models

### `/src/lib/components`
**Purpose:** Reusable Svelte components

- **`pool/`** - Pool management dialogs (9 specialized dialogs)
- **`ui/`** - shadcn-svelte UI primitives (14+ component sets)
- **`app-sidebar.svelte`** - Main navigation
- **`AuthLogin.svelte`** - Login form

### `/src/lib/utils`
**Purpose:** Utility functions and helpers

- **`auth-guard.ts`** - Server-side authentication middleware using JWT
- **`jwt-auth.ts`** - JWT token creation, verification, and API key encryption
- **`pool-handlers.ts`** - Handlers for pool power, sharing, testing, etc.
- **`file-conversion.ts`** - File format conversions
- **`timezones.ts`** - Timezone display utilities
- **`helper.ts`** - General purpose helper functions

### `/src/routes`
**Purpose:** SvelteKit file-based routing (pages & API endpoints)

Each route folder contains:
- `+page.svelte` - UI component
- `+page.server.ts` - Server-side logic, data loading, and authentication

**Key Routes:**
- `/` - Dashboard/home page
- `/pools` - All pools overview
- `/pool/[poolId]` - Individual pool details
- `/create` - Create new pool
- `/topologies` - Topology management
- `/scenarios` - Scenario configuration
- `/users` - User administration
- `/roles` - Role management
- `/templates` - VM template management
- `/ctfd` - CTFd integration

**API Routes:**
- `/api/auth/*` - Authentication endpoints
- `/api/proxy/*` - Backend service proxies

---

## Configuration Files

| File | Purpose |
|------|---------|
| **artemis-frontend.service** | Systemd service unit for production deployment |
| **components.json** | shadcn-svelte component configuration |
| **nginx.conf** | Reverse proxy with SSL termination, rate limiting, security headers |
| **package.json** | NPM dependencies, scripts, project metadata |
| **svelte.config.js** | SvelteKit adapter, CSRF, and preprocess settings |
| **tsconfig.json** | TypeScript compiler options and path aliases |
| **vite.config.ts** | Vite build tool configuration |

