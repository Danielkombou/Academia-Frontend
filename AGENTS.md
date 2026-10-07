<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# veni

## What this is

**Veni**, a bulk certificate generator. Teachers, event organisers and organisations
upload a certificate template, upload a list of recipient names, position the name on the
page, preview it, then generate and download hundreds of personalised certificates as a
ZIP.

The product was called CertiGen until the rebrand. This app is Veni.

## The one rule that matters

**The Next.js app must behave exactly like the React app.** No behaviour changes, no
"improvements", no new features, no removed features until parity is proven.

The React app at `~/Projects/veni-react` is the reference implementation and the spec.
When in doubt about what something should do, read the React source, port it as it is.

Parity means all of this matches:

1. Every screen and step of the flow (landing, template upload, names upload, position,
   preview and generate, done and download).
2. Every formatting rule (name title casing, first N names in full, the rest as initials,
   stripping leading numbering such as `1. Name`).
3. Every file type accepted (PNG, JPG, PDF for templates; CSV, TXT, DOCX for names).
4. Every output (PDF page size and orientation from template aspect ratio, template
   resolution cap, font, colour, centred name position, ZIP contents and file names,
   sample PDF download).
5. The look and feel, including dark mode.

Branding and the design system are the two deliberate exceptions. Where the React app says
CertiGen, this app says Veni, and the purple theme is replaced by the Veni theme below.
Nothing else may differ.

## Branding

The name is **Veni**. Capital V, lowercase eni. Never CertiGen, never certigen, never
certi-gen in anything user facing.

The React app still carries the old name in 12 places, so when porting, change the name
as you go rather than copying it across:

- `package.json` name (this repo is already `veni`)
- `index.html` title, description, `og:site_name`, `og:title`, `twitter:title`
- `src/components/Header.tsx`, the logo wordmark
- `src/components/Footer.tsx`, the copyright line
- `src/App.css`, the `.certigen-app` root class, and its use in `App.tsx`

In this repo the equivalent surfaces are `app/layout.tsx` for metadata (title, description,
Open Graph, Twitter) and the `Header` and `Footer` components. There is no `index.html`,
so port those meta tags into `layout.tsx` rather than dropping them.

## Design system

shadcn is set up, on the **base-sera** style with base color **neutral**. This is not the
usual Radix setup, so a few things differ from what you may expect:

- Primitives come from `@base-ui/react`, not `@radix-ui/react`.
- Primitives compose with a **`render` prop**, not Radix's `asChild`. To put two triggers on
  one element, pass the same element to both `render` props and let base UI merge the refs.
  `components/theme-toggle.tsx` does this for a tooltip trigger plus a dropdown trigger.
- Class merging uses the `cn` package, re-exported from `lib/utils.ts`. There is no
  `clsx` or `tailwind-merge` dependency. Import `cn` from `@/lib/utils`, always.
- Icons are `lucide-react`.
- Colours are authored in **oklch**, not hsl or hex.
- Animations need the `tw-animate-css` and `shadcn/tailwind.css` imports at the top of
  `app/globals.css`. Do not drop them.
- `components.json` holds the shadcn config. Aliases point at `@/components`, `@/lib`,
  `@/components/ui`, and `@/hooks`.

Add components with `npx shadcn@latest add <name>`, and read the generated file before
using it. Components arrive as source you own and may edit.

Two things to know about that generated source:

- `components/ui/dropdown-menu.tsx` is hand edited. `DropdownMenuRadioItem` draws a filled
  dot rather than the generated check mark. Do not regenerate that file from the registry or
  the dot reverts.
- Tailwind's width and height are **ignored on a bare inline `span`**. The dot needs `block`
  to have any size at all. Without it the dot typechecks, builds, and reports the right colour
  while rendering at zero by zero, which is invisible. Reach for `block` or `inline block`
  whenever you size a `span`.

### The Veni theme

Green primary, `oklch(0.683 0.112 161.7)`, which is the extracted log's
`hsl(153 38% 49.6%)` and renders as `#4faf83`. The `#52ab82` quoted in earlier notes is a
different colour, `hsl(152.4 35.2% 49.6%)`, and is not what ships. Radius `0.725rem`. Fonts
are Outfit for sans, Nunito for serif, and JetBrains Mono for mono, all loaded through
`next/font/google` and exposed as CSS variables on `<html>`.

Token names are the standard shadcn ones (`--background`, `--primary`, `--muted`,
`--destructive`, `--border`, `--ring`, and so on), so every shadcn component works
against them. Change the values, never the names.

The React app used purple `#aa3bff` and its own grey dark mode scale. Do not port those
colours across. Map them onto theme tokens instead: for example `#aa3bff` becomes
`bg-primary`, `#6b6375` becomes `text-muted-foreground`, and `#2e303a` becomes
`border-border`.

### Global CSS gotchas

Read this before editing `app/globals.css`, each of these bites quietly rather than
loudly:

- **Keep `@theme inline`, not a plain `@theme`.** Not for the reason you will find repeated
  elsewhere: an opacity modifier on a colour does not need it, because the modifier goes
  through `color-mix` and a plain `@theme` carries it too. Keep `inline` because it reads each
  raw value straight into the utility instead of hopping through a variable, and because the
  three font stacks need a theme value to compose. Do not change it back either way.
- **Keep `@custom-variant dark (&:is(.dark *));`.** Without it the `dark:` utilities stop
  responding to the `.dark` class.
- **Never make a `@theme` entry point at itself.** `--shadow-custom: var(--shadow-custom)`
  is self referential and invalid. Give the raw value a separate name in `:root`, for
  example `--shadow-raised`, then bind `--shadow-custom: var(--shadow-raised)`.
- **Keep `--chart-1` through `--chart-5` and the `--sidebar-*` tokens.** Nothing uses
  them yet, but chart and sidebar components reference them on arrival.
- **`npx shadcn add` will rewrite `app/globals.css`.** `components.json` says
  `baseColor: "neutral"`, which changes which palette clobbers the Veni values but does not
  prevent it. Check the diff on `globals.css` after every add.
- **`color-mix(in oklch, ...)` appears inside component files**, not just theme
  definitions. `components/ui/button.tsx` has one in its `secondary` variant. Keep the
  oklch colour space so those keep working.

### Fonts

`app/layout.tsx` defines `--font-outfit`, `--font-nunito` and `--font-jetbrains-mono`, and
the theme block in `app/globals.css` binds them to the Tailwind `font-sans`, `font-serif` and
`font-mono` utilities plus `--font-heading`, which also resolves to Outfit so the seven
components that use it keep working without a fourth family. Keep one definition per custom
property. Loading a second font into an existing variable name silently replaces the first.

Note that `--font-serif` is bound to Nunito, which is a rounded, friendly serif. Any
`font-serif` usage reads as soft rather than traditional.

The React app had no webfonts at all; it leaned on `system-ui`. Every font change here is
a deliberate design decision, not parity.

### Dark mode

Dark mode is owned by **`next-themes`** (see `components/providers/theme-provider.tsx`),
mounted once in the root layout. Follow the system by default, remember the visitor's
choice, and let a header control override it. Three states: `light`, `dark`, and `system`.

The React app keyed dark mode off the operating system with
`@media (prefers-color-scheme: dark)` and had no toggle, so the control is a deliberate
departure from parity.

Five things about this setup are load bearing, and each one breaks quietly:

- **`attribute="class"` is mandatory.** The package's own default is `data-theme`, which
  compiles to nothing here, because `app/globals.css` keys the `dark` variant off a `.dark`
  class. Every `dark:` utility would silently stop working.
- **The storage key is `veni-theme`** (`storageKey` on the provider). It appears nowhere
  else in the codebase, so change it in one place only.
- **`<html>` carries `suppressHydrationWarning`, permanently.** The package's own inline
  script sets the class before React hydrates, and React would otherwise report a mismatch
  it cannot fix. Never add `dark` to the html className in `app/layout.tsx`: the script owns
  that class, and React must not also write it.
- **Never write the class yourself.** The package injects a `transition: none !important`
  style for the duration of each switch so animated elements do not sweep between palettes.
  Setting the class by hand skips that.
- **The theme control needs a mounted guard.** `theme` and `resolvedTheme` are `undefined` on
  the server and on the first client render, so a control that reads them renders a
  same size placeholder until it has mounted. `components/theme-toggle.tsx` does this. Its
  `TooltipProvider` lives inside it, so placing the control is the only job a consumer has.

A stored value the package does not recognise (`banana`) becomes a class token, which renders
light with nothing marked in the menu. Only hand edited storage causes this, so there is no
guard. With scripting off the app is light only; there is no CSS fallback.

In development, React 19 logs one error per page load about a script tag inside a React
component. It comes from `next-themes` rendering its own script, which has already run by
then. The production console is clean. Do not chase it.

## Porting notes

The app runs entirely in the browser, so most of it stays a client component. Watch these
when porting, they are the places Next.js behaves differently from Vite:

- **Everything below `src/` in the React app is client only.** jsPDF, JSZip, pdfjs
  `getDocument`, `FileReader`, `canvas`, `Image`, and object URLs all need the browser.
  Mark those files and components with `use client`.
- **pdfjs worker.** The React app imports the worker URL with a Vite `?url` suffix. Next
  needs its own way to point `GlobalWorkerOptions.workerSrc` at the worker, and it must
  only be set in the browser.
- **mammoth.** The React app imports `mammoth/mammoth.browser` and carries a local type
  declaration for it. Port both, or server render will fail on Node globals.
- **`alert()` calls.** The React app uses `alert` for template and DOCX errors, and for
  the Pricing, Docs, and Login nav links. Keep them for parity rather than swapping in a
  nicer dialog.
- **Ports and paths.** Vite served on 5173, Next serves on 3000. Tailwind moves from the
  `@tailwindcss/vite` plugin to `@tailwindcss/postcss`, both on Tailwind 4.
- **Linting swaps.** The React app uses ESLint. This repo uses Biome (`pnpm lint`,
  `pnpm format`). The generated shadcn components were shipped without semicolons and have
  since been run through `pnpm format`, so they now match Biome and `pnpm lint` is quiet on
  them apart from import sorting and a few semantic element warnings.
- **`LayoutProps<"/">`.** Next 16 generates typed route props. `app/layout.tsx` already
  uses `RootLayout({ children }: LayoutProps<"/">)`. Keep that form rather than the older
  `Readonly<{ children: React.ReactNode }>`, so typed routes stay wired up.

## Commands

    pnpm dev       # dev server on http://localhost:3000
    pnpm build     # production build
    pnpm lint      # biome check
    pnpm format    # biome format --write
    pnpm test      # vitest run

## Git

integration: on

## Stack

Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4, Biome, pnpm,
shadcn (base sera style, `@base-ui/react` primitives), and `next-themes` for the theme
provider.

Runtime libraries still to add, all from the React app: `jspdf`, `jszip`, `pdfjs-dist`,
`mammoth`.

**Build approach**: Tracer Bullet, from the `docs/scope/scope.md` header. Prove each thin
slice end to end against a known good reference before starting the next one.

## Current state

Foundations A and B are in place, feature 1 (the Veni theme and typography) is done, and
feature 2 (the theme provider and dark mode toggle) is built and self checked.
`app/globals.css` carries the Veni green palette in oklch with a 0.725rem radius,
`app/layout.tsx` loads Outfit, Nunito and JetBrains Mono and wraps the body in
`ThemeProvider`, and `components.json` is on `baseColor: "neutral"`.

`components/ui/` holds 61 shadcn components, seven of which use `font-heading`. `pnpm lint`
reports 62 errors in those generated components, all import sorting, import type and semantic
element warnings that predate this work, and `pnpm test` passes 81 tests over
`app/globals.css` and `app/layout.tsx`.

`components/theme-toggle.tsx` is built but **nothing renders it yet**, so dark mode is
reachable only through the saved choice and the operating system. Route shape and the app
shell are feature 3, and that is where the control gets its home. `app/page.tsx` is still the
starter page and hardcodes `bg-zinc-50`, `bg-white`, `bg-black` and `text-black`, so it
cannot show the theme. The CertiGen source has not been ported yet, and the rebrand has not
been applied to any ported code since nothing is ported.

## Conventions

- Two space indent, double quotes, semicolons (Biome defaults, do not fight them).
- `@/*` path alias points at the project root, so `@/app/page` and `@/lib/zipUtils` both
  work.
- Keep components named after the step they render, the way the React app does
  (`StepTemplate`, `StepNames`, `StepPosition`, `StepPreview`, `StepDone`, plus `Header`,
  `Hero`, `Footer`).
- `vitest.setup.ts` stubs `window.matchMedia`. jsdom implements none of it, so any test that
  renders the theme provider, directly or through `app/layout.tsx`, throws without the stub.
  Removing it fails 10 tests today. Keep the stub before debugging such a failure.

## Agent skills

- [tailwindcss](file:///home/afuhflynn/.agents/skills/tailwindcss/SKILL): Tailwind CSS 4
  conventions for the whole project, including the class based `dark` variant that the theme
  provider depends on. Owner `anthropics/skills`. Read
  `references/features-dark-mode.md` before touching dark mode.
- Declined: an Agent Skill for `next-themes`. The candidates were templated prose from auto
  generated package repos, and one teaches the manual `html[data-theme]` pattern, which would
  fight this project's `.dark` class. Its conventions are recorded in the Dark mode section
  above instead.
