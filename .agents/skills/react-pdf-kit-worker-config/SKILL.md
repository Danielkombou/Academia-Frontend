---
name: react-pdf-kit-worker-config
description: Override the pdfjs-dist version and configure the PDF.js worker URL for @react-pdf-kit/viewer (>=2.0.0 <3.0.0) via the RPConfig workerUrl prop, with Vite, Next.js Turbopack, and webpack recipes. The default needs no setup.
metadata:
  react_pdf_kit_version: ">=2.0.0 <3.0.0"
  pdfjs_dist_version: ">=4.0.0 <6.0.0"
  frameworks: [vite, next.js, webpack, react]
  tags: [pdf-viewer, pdfjs-worker, configuration]
---

# react-pdf-kit-worker-config

**Use this skill when**: the developer needs to override the
`pdfjs-dist` version (for example, pinning to `4.10.38` for specific
compatibility requirements) or point the PDF.js worker at a custom URL. This is
the single home for all worker and `pdfjs-dist` configuration; the
setup and framework skills deliberately contain none.

## Default: zero configuration

In v2, `@react-pdf-kit/viewer` ships `pdfjs-dist` as a peer dependency
pinned to `5.4.530`, and `RPConfig` configures the worker
automatically. **For the common case you install only the viewer and
do nothing else** — no `pdfjs-dist` install, no `workerUrl`. Reach for
the recipes below only when you must change the `pdfjs-dist` version or
serve the worker from a custom location.

## Gotchas

- **Override through the `workerUrl` prop, not `GlobalWorkerOptions`.**
  Pass `<RPConfig workerUrl="...">`; `RPConfig` applies it. Setting
  `pdfjs.GlobalWorkerOptions.workerSrc` by hand fights the library's
  own setup.
- **Changing the `pdfjs-dist` version is a two-part job**: install the
  version AND add a package-manager override, otherwise a transitive
  copy of the default version can win.
- **Match the worker file to the installed version.** A `workerUrl`
  pointing at a different `pdfjs-dist` build than the one resolved at
  runtime causes version-mismatch errors.
- **Downgrading below `4.10.38` is not supported** and can break viewer
  functionality. `4.10.38` is the documented floor; `5.4.530` is the
  default. Note: `@react-pdf-kit/viewer` ships polyfills so v5 works
  across supported browsers — prefer v5 unless you have a specific
  compatibility constraint that requires v4.

## Procedure

### Step 1 — Install the target `pdfjs-dist` and pin it

Install the version you want, then lock it with an override so every
resolution uses it.

```bash
pnpm add pdfjs-dist@4.10.38     # example: pin to v4 for specific compatibility requirements
```

```jsonc
// package.json
{
  // pnpm:
  "pnpm": { "overrides": { "pdfjs-dist": "4.10.38" } },
  // npm:
  "overrides": { "pdfjs-dist": "4.10.38" },
  // yarn:
  "resolutions": { "pdfjs-dist": "4.10.38" }
}
```

Use the field that matches your package manager, then reinstall.

### Step 2 — Point `RPConfig` at the matching worker

Pick the recipe for your bundler.

#### Vite

Add `pdfjs-dist` to `optimizeDeps.include`, then import the worker with
Vite's `?url` suffix and pass it to `workerUrl`:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
export default defineConfig({
  optimizeDeps: { include: ['pdfjs-dist'] },
})
```

```tsx
import { RPConfig } from '@react-pdf-kit/viewer'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

export function Providers({ children }: { children: React.ReactNode }) {
  return <RPConfig workerUrl={workerSrc}>{children}</RPConfig>
}
```

TypeScript users: if `?url` imports error, add a declaration file.

```ts
// global.d.ts
declare module '*?url' {
  const content: string
  export default content
}
```

#### Next.js 15+ (Turbopack)

Resolve the worker with the `import.meta.url` pattern and pass it to
`workerUrl` in your client `RPConfig` wrapper:

```tsx
// app/components/AppProviders.tsx
'use client'
import { RPConfig, type RPConfigProps } from '@react-pdf-kit/viewer'
import { type PropsWithChildren } from 'react'

const workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export default function AppProviders({
  children,
  ...props
}: PropsWithChildren<Omit<RPConfigProps, 'workerUrl'>>) {
  return (
    <RPConfig workerUrl={workerSrc} {...props}>
      {children}
    </RPConfig>
  )
}
```

(See `react-pdf-kit-nextjs-app-router` for the surrounding
client-only / dynamic-import structure.)

#### React + webpack

Copy the worker into your output with `copy-webpack-plugin`, then point
`workerUrl` at the copied path:

```js
// webpack.config.js
const CopyPlugin = require('copy-webpack-plugin')
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs',
          to: 'pdf.worker.min.mjs',
        },
      ],
    }),
  ],
}
```

```tsx
<RPConfig workerUrl="/pdf.worker.min.mjs">{children}</RPConfig>
```

### Alternative: CDN-hosted or self-hosted worker

`workerUrl` accepts any URL, so you can also serve the worker from a CDN
or a fixed public path. Pin the URL to the exact installed
`pdfjs-dist` version (never "latest"), and update your CSP `worker-src`
to include that origin (or `'self'` for a same-origin path).

## Verify

```bash
pnpm install
pnpm build
pnpm dev   # or your equivalent serve step
```

In DevTools Network tab, filter for `pdf.worker`. You should see exactly
one request, status 200, content-type `application/javascript` (or
`text/javascript`). Open a PDF and confirm text selection works on a
rendered page — that confirms the worker is answering PDF.js's calls,
and that the worker build matches the installed `pdfjs-dist`.

## References

- PDF.js worker docs: <https://github.com/mozilla/pdf.js/wiki/Setup-PDF.js-in-a-website>
- MDN `worker-src`: <https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy/worker-src>
- Companion skills:
  - `react-pdf-kit-setup`: first-time setup (no worker config needed).
  - `react-pdf-kit-nextjs14-pdfjs-override`: Next.js 14 compatibility
    (v2 is unsupported on Next.js 14).
