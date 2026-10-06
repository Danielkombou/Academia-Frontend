---
name: react-pdf-kit-nextjs-app-router
description: Integrate @react-pdf-kit/viewer (>=2.0.0 <3.0.0) into a Next.js 15 App Router project using a 'use client' boundary and dynamic imports with ssr:false for RPConfig and the viewer.
metadata:
  react_pdf_kit_version: ">=2.0.0 <3.0.0"
  pdfjs_dist_version: ">=5.0.0 <6.0.0"
  frameworks: [next.js, react]
  tags: [next.js, app-router, pdf-viewer]
---

# react-pdf-kit-nextjs-app-router

**Use this skill when**: the developer asks to add a PDF viewer using
`@react-pdf-kit/viewer` to a **Next.js App Router** project (`app/`
directory) on **Next.js 15+** (with Turbopack). For Pages Router use
`react-pdf-kit-nextjs-pages-router`. **Next.js 14 is not supported by
v2** — see `react-pdf-kit-nextjs14-pdfjs-override`.

The viewer is client-only: it relies on browser APIs and cannot run on
the server. The skill structures the integration around that
constraint.

## Gotchas

- **The viewer cannot render on the server.** Importing it into a
  Server Component (or letting Next SSR it) throws
  `TypeError: Promise.withResolve is not a function`. Every component
  that imports from `@react-pdf-kit/viewer` needs `'use client'`, AND
  must be mounted through a `next/dynamic` import with `ssr: false`.
- **Install only `@react-pdf-kit/viewer`. Do NOT install `pdfjs-dist`
  separately.** It is an auto-installed peer dependency. No worker
  configuration is required either — `RPConfig` handles it. Custom
  worker URLs / version overrides live in
  `react-pdf-kit-worker-config`.
- **`RPConfig` should be rendered once**, at the root layout, so the
  license and config apply app-wide. The page-level viewer mounts the
  `RPProvider` / `RPLayout` / `RPPages` chain.
- **Use Turbopack on Next.js 15** (`next dev --turbopack`) for the
  smoothest experience. Next.js 14 + webpack is unsupported by v2.
- **Hydration**: render the viewer inside a fixed-height container so
  layout doesn't shift. Without a definite height the virtualizer can
  mount with 0 rows.
- **`RPDefaultLayout` is deprecated** in v2. Use `RPLayout`.

## Procedure

### 1. Install the library

```bash
pnpm add @react-pdf-kit/viewer
```

### 2. Put `RPConfig` at the root layout (client-only)

```tsx
// app/components/AppProviders.tsx
'use client'
import { RPConfig, type RPConfigProps } from '@react-pdf-kit/viewer'
import { type PropsWithChildren } from 'react'

export default function AppProviders({
  children,
  ...props
}: PropsWithChildren<RPConfigProps>) {
  return <RPConfig {...props}>{children}</RPConfig>
}
```

```tsx
// app/components/LazyAppProviders.tsx
'use client'
import dynamic from 'next/dynamic'

const LazyAppProviders = dynamic(() => import('./AppProviders'), {
  ssr: false,
})
export default LazyAppProviders
```

```tsx
// app/layout.tsx
import { type PropsWithChildren } from 'react'
import LazyAppProviders from './components/LazyAppProviders'

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <LazyAppProviders licenseKey="your-license-key">
          <main>{children}</main>
        </LazyAppProviders>
      </body>
    </html>
  )
}
```

`licenseKey` is optional; without it the viewer runs in trial mode
(watermark).

### 3. Create the viewer and its lazy wrapper

```tsx
// app/components/AppPdfViewer.tsx
'use client'
import { RPProvider, RPLayout, RPPages } from '@react-pdf-kit/viewer'

export default function AppPdfViewer({ pdfSrc }: { pdfSrc: string }) {
  return (
    <RPProvider src={pdfSrc}>
      <RPLayout toolbar>
        <RPPages />
      </RPLayout>
    </RPProvider>
  )
}
```

```tsx
// app/components/LazyAppPdfViewer.tsx
'use client'
import dynamic from 'next/dynamic'

const LazyAppPdfViewer = dynamic(() => import('./AppPdfViewer'), {
  ssr: false,
})
export default LazyAppPdfViewer
```

### 4. Use it in a page inside a definite-height container

```tsx
// app/document/[id]/page.tsx
import LazyAppPdfViewer from '../../components/LazyAppPdfViewer'

export default function DocumentPage({ params }: { params: { id: string } }) {
  return (
    <main style={{ height: '100vh' }}>
      <LazyAppPdfViewer pdfSrc={`/api/documents/${params.id}.pdf`} />
    </main>
  )
}
```

## Verify

```bash
pnpm install
pnpm build
pnpm dev --turbopack   # then visit /document/<id>
```

Open the page. The first PDF page should render with the default
toolbar. Scroll to confirm virtualization, and select text on a
rendered page to confirm the text layer mounted. There should be no
`Promise.withResolve is not a function` error in the console.

## References

- Next.js dynamic import: <https://nextjs.org/docs/app/api-reference/functions/dynamic>
- Companion skills:
  - `react-pdf-kit-nextjs14-pdfjs-override`: read this if the project
    is on Next.js 14 (v2 is unsupported there).
  - `react-pdf-kit-worker-config`: for overriding `pdfjs-dist` and the
    Next.js 15 / Turbopack `workerUrl` recipe.
