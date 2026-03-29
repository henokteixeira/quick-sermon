# Frontend — Agent Instructions

## Stack
Next.js 14 (App Router) · React 18 · TypeScript (strict) · Tailwind CSS · shadcn/ui · TanStack Query v5 · Zustand · Axios · next-intl (pt-BR)

## Architecture

### Directory Structure
```
frontend/
├── app/
│   ├── layout.tsx              # Root: fonts, providers, metadata
│   ├── globals.css             # Tailwind base + CSS variables
│   └── (dashboard)/
│       ├── layout.tsx          # Sidebar, nav, AuthGuard
│       ├── videos/
│       │   ├── page.tsx        # Video list
│       │   └── [id]/
│       │       ├── page.tsx    # Video detail
│       │       └── clip/new/
│       │           └── page.tsx # Clip editor
│       └── ...
├── components/
│   ├── ui/                     # shadcn/ui — DO NOT edit manually
│   └── features/               # Domain components grouped by feature
│       ├── auth/
│       ├── videos/
│       ├── clips/
│       └── ...
├── lib/
│   ├── api/                    # Axios API functions (one file per domain)
│   │   ├── client.ts           # Axios instance + interceptors
│   │   ├── videos.ts
│   │   └── clips.ts
│   ├── types/                  # TypeScript interfaces (one file per domain)
│   │   ├── video.ts
│   │   └── clip.ts
│   ├── stores/                 # Zustand stores
│   │   └── auth-store.ts
│   ├── hooks/                  # Custom React hooks
│   ├── formatters.ts           # Shared formatting functions
│   └── utils.ts                # cn() utility (clsx + tailwind-merge)
├── providers/
│   └── query-provider.tsx      # React Query config
├── messages/
│   └── pt-BR.json              # i18n translations
└── i18n/
    └── request.ts              # Locale config (hardcoded pt-BR)
```

## Conventions

### Page Components
```tsx
"use client";

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: video, isLoading } = useQuery({
    queryKey: ["video", id],
    queryFn: () => getVideo(id),
  });

  if (isLoading) return <LoadingSkeleton />;
  if (!video) return null;

  return ( /* ... */ );
}
```
- `"use client"` directive for interactive pages
- Loading → empty → content pattern
- Skeleton loading states (never spinners for page-level loading)

### Feature Components
```tsx
"use client";

export function ClipList({ videoId }: ClipListProps) {
  const { data } = useQuery({ ... });
  const mutation = useMutation({ ... });
  // ...
}
```
- Named exports (not default)
- Props interface defined above or inline
- Sub-components can live in the same file if tightly coupled
- File naming: `kebab-case.tsx`

### API Functions
```tsx
// lib/api/clips.ts
export async function createClip(data: { video_id: string; ... }): Promise<Clip> {
  const response = await apiClient.post<Clip>("/clips", data);
  return response.data;
}
```
- One file per domain under `lib/api/`
- Functions are async, typed params and return
- Use `apiClient` (Axios instance with JWT interceptors)
- Parameters use snake_case to match backend API

### Type Definitions
```tsx
// lib/types/clip.ts
export type ClipStatus = "pending" | "downloading" | "trimming" | "ready" | ...;

export interface Clip {
  id: string;
  status: ClipStatus;
  // ...
}
```
- One file per domain under `lib/types/`
- Union types for enums (string literals)
- Interfaces for objects
- `PaginatedResponse` pattern: `{ items: T[], total, page, page_size, total_pages }`

### React Query Patterns
```tsx
// Fetching
const { data, isLoading } = useQuery({
  queryKey: ["clips", videoId],
  queryFn: () => listClips({ video_id: videoId }),
  refetchInterval: (query) => {
    const hasActive = query.state.data?.items?.some(isActiveStatus);
    return hasActive ? 3_000 : 15_000;
  },
});

// Mutations
const mutation = useMutation({
  mutationFn: (id: string) => deleteClip(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["clips", videoId] });
  },
});
```
- Query keys are hierarchical arrays: `["resource", id, ...params]`
- `staleTime: 60_000` default (via QueryProvider)
- Conditional `refetchInterval` for polling active processes
- `onSuccess` → invalidate related queries

### Zustand (Client State)
Only for auth state (`lib/stores/auth-store.ts`). Persisted to localStorage. Everything else is React Query (server state).

### Shared Formatters
All formatting functions live in `lib/formatters.ts`:
- `formatTime(seconds)` → `"H:MM:SS"`
- `parseTime(string)` → `number | null`
- `formatFileSize(mb)` → `"350 MB"` / `"1.2 GB"`
- `formatFileSizeFromBytes(bytes)` → same
- `formatDuration(seconds)` → `"1h30m00s"`
- `formatViews(count)` → `"1.2K"` / `"1.2M"`
- `formatUploadDate(YYYYMMDD)` → localized date
- `formatDate(ISO)` → localized date

**Never** define local formatting functions in components — import from `lib/formatters.ts`.

### Internationalization
```tsx
const t = useTranslations("clips.editor");
<h1>{t("title")}</h1>
```
- All UI text comes from `messages/pt-BR.json`
- Use `useTranslations(namespace)` hook
- Nested key paths: `"clips.editor.title"`, `"videos.errors.not_found"`

### Styling
- **Tailwind CSS** utility-first with design tokens via CSS variables
- **shadcn/ui** components from `components/ui/` — generated via CLI, never edit
- **Dark mode** via `dark:` prefix (class-based)
- **Responsive**: mobile-first, `md:` for desktop layouts
- **`cn()`** helper for conditional classes: `cn("base", condition && "active")`
- Font: Inter (sans) + DM Serif Display (serif headings via `font-serif`)
- Accent color: amber-500 (`#f59e0b`)

### Component Organization
| Location | Purpose | Edit? |
|----------|---------|-------|
| `components/ui/` | shadcn/ui primitives | Never manually |
| `components/features/{domain}/` | Domain-specific components | Yes |
| `app/(dashboard)/.../page.tsx` | Page components | Yes |

## Commands
```bash
cd frontend
npm run dev              # Dev server (port 3000)
npm run build            # Production build
npm run lint             # ESLint
npx tsc --noEmit         # Type check
```

## Formatting
- **Prettier** — double quotes, semicolons, 2-space indent, trailing commas (ES5)
- **ESLint** — next/core-web-vitals + next/typescript
