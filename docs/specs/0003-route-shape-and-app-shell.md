# 0003. Split the routes and build the app shell

**Date**: 2026-10-05
**Status**: In Progress

## Summary

The React reference app is one long scrolling page: a header, a hero, then the five certificate
steps all in a single flow. This spec splits that into two routes, a landing page at `/` and the
generator at `/generate`, and builds the three shared shell components on your shadcn components
and Veni tokens. A shared route group layout owns the header and footer so the two routes cannot
drift apart. The header gets the theme control feature 2 built and is still waiting for a home. The
unknown path page is fixed too, since it currently ignores the visitor's colour choice. Nothing in
`app/globals.css` changes, no new dependency is added, and no certificate step is built here.

## Context

The React app at `~/Projects/veni-react` is the parity spec and it renders one page. `App.tsx`
returns a wrapper containing `Header`, then `Hero` with an `onStart` handler, then an empty
`.ticks` div, then a `#generator-flow` section that holds a step 0 prompt card plus all five step
components, then `Footer`. The flow position is one `useState` integer in that single component.
Clicking the hero's start control sets it to 1 and smooth scrolls to the flow.

`app/page.tsx` in this repo is still the Next.js starter page, hardcoding `bg-zinc-50`,
`bg-white`, `bg-black` and `text-black`, so it cannot show the Veni theme at all. There is one
route and it is not the product.

Two things the previous features left for this one. Spec 0002 built `components/theme-toggle.tsx`
and shipped it as an export nothing imports, because dark mode was unreachable from the interface
and placement was left to the shell. And while verifying feature 2, a fault was found that spec
0002 does not record and whose `Verify it` box is still unticked: Next.js's built in unknown path
page injects its own unlayered stylesheet keyed to the operating system's colour scheme, so a
visitor who chose light on a dark machine gets a black page with white text, and the reverse holds
too. The Next.js documentation for `not-found` states this directly, that the default UI "follows
the operating system's color scheme via `prefers-color-scheme` and does not read an app-level theme".
There is no `app/not-found.tsx`, so the framework page is what renders.

Two forces pull against each other. The parity rule says nothing may differ from the reference
except the branding and the design system, and the reference has one page with a specific hero.
The engineer has asked for a landing page with more character than a direct port. The line to hold
is functional parity, which the scope states explicitly: the three nav links must still alert
exactly as they do today, and the start control must still lead to the flow. Visual composition is
where the latitude sits, and this spec spends it once, on the landing page, and keeps the header
and footer as faithful ports.

Veni has no server, no account and no database, so there is no persistence question here. The flow
position is one integer held in the generator page's own component.

## Requirements

**User stories**:
- As a person arriving at Veni, I want a landing page that tells me what the tool does and gives
  me one obvious way to start, so that I know what I am about to do before I do it.
- As a person who has started generating, I want the five steps laid out in order, so that I know
  how many steps there are and what comes next.
- As a person using Veni, I want the header, its links and the colour control on every page, so
  that the app feels like one product wherever I am.
- As a person who mistypes a link, I want the unknown path page in the colour I chose, so that a
  dead end does not look like a different website.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `/` renders the header, the hero, the five step row and the footer, in that order.
- **AC-2**: `/generate` renders the header, a flow region, and the footer. The flow region carries a
  placeholder that states plainly that the certificate steps arrive in the following features, so an
  empty page cannot be mistaken for a broken one.
- **AC-3**: The header renders on both routes and stays put while the page scrolls. Its background is
  fully opaque, so content scrolling underneath never shows through it.
- **AC-4**: The wordmark reads `Veni`, never `CertiGen`, and links to `/` now that there are two
  routes.
- **AC-5**: Pricing, Docs and Login each fire their reference alert strings exactly:
  `Pricing plans coming soon!`, `Documentation coming soon!`, `Login modal coming soon!`. Pricing and
  Docs stay anchors whose default is prevented, Login stays a button, matching the reference's own
  element choices.
- **AC-6**: The theme control renders in the header's right hand group, after Login.
- **AC-7**: The hero shows the eyebrow line reading `Instant Bulk Certificate Generation & PDF
  Export` with a lightning icon, the headline `Generate Certificates in Seconds`, the two line
  subtitle `Upload a template, upload your names file,` and `and download hundreds of certificates
  instantly.`, and a `Start Generating` control that navigates to `/generate`.
- **AC-8**: `Hero` takes no props. The start control is a link to `/generate`, rendered through the
  Button's `render` prop with `nativeButton` set to false, so the primitive does not put a button
  type attribute onto an anchor.
- **AC-9**: The step row shows exactly these five labels, each preceded by its step number, taken
  from the scope's own step names: `Template upload`, `Names upload`, `Position and name
  formatting`, `Preview and generate`, `Download the batch`. They are static labels, not links,
  because none of those screens exists yet.
- **AC-10**: The step row becomes a single column at the `sm` breakpoint and below.
- **AC-11**: The header keeps the reference's single flex row with no narrow screen handling, so the
  two routes match the reference at every width.
- **AC-12**: The footer reads `© <year> Veni. All rights reserved.` The year is computed on the
  server and passed into the footer, so the first client render matches it exactly, and an effect
  corrects it after mount if the build is old enough that the year has changed.
- **AC-13**: No emoji appears in the shell. The wordmark and the hero eyebrow use lucide icons, which
  are already installed.
- **AC-14**: The root layout carries a real title, description, Open Graph and Twitter tags naming
  Veni. No `Create Next App` value survives anywhere in the metadata.
- **AC-15**: `/generate` asks search engines not to index it. `/` stays indexable.
- **AC-16**: An unknown path renders the Veni header and footer, a heading reading `That page does
  not exist`, a line of supporting copy, and a link back to `/`. It renders in the visitor's chosen
  colour, in both directions: a light choice on a dark machine renders light, and a dark choice on a
  light machine renders dark.
- **AC-17**: Both routes prerender as static content. Nothing here reads storage or a request header
  on the server.
- **AC-18**: No file in `app/globals.css` changes, and no component in this feature writes a raw
  colour. Everything resolves through theme tokens.
- **AC-19**: `pnpm build` passes, `pnpm lint` reports nothing beyond the recorded baseline of 62
  errors, all in `components/ui/`, and `pnpm test` passes the 81 existing tests plus any this
  feature adds.

## Options considered

### Option 1: Two routes, flow position local to the generator

`/` is the landing page and `/generate` is the flow. The start control navigates. The flow
position is one `useState` integer inside the generator page, starting at 1.

**Pros**:
- Keeps features 4 to 8 shaped exactly like the reference, where each step's Next and Edit is a
  plain state change with no navigation, which is what the reference does today.
- Nothing to persist, nothing to invalidate, nothing to keep in step.
- A direct visit to `/generate` or a refresh lands on step 1, which is the sensible place to start.

**Cons**:
- A refresh mid flow loses the position and any uploaded file, which the reference also loses on a
  reload, so this is at parity.
- The step 0 prompt card has nowhere to live, so it goes (see Rationale).

### Option 2: Two routes, flow position in the URL

`/generate` reads and writes a `step` search parameter, so every transition is a navigation.

**Pros**:
- Refresh and the back button work mid flow, and a link to a specific step can be shared.
- The position is visible and linkable rather than hidden in a component.

**Cons**:
- Turns every Next and Edit into a navigation, which is slower and changes how the steps feel
  against the reference.
- Makes features 4 to 8 own routing logic rather than plain component state, for a benefit nobody
  asked for.
- Interacts badly with the lost uploaded file: a shareable step link restores the position but not
  the template.

### Option 3: Two routes, flow position in a root layout store

A client provider in the root layout holds the position, so it survives the navigation from `/` to
`/generate`.

**Pros**:
- Closest match to the reference, where the position lives in the one component that renders
  everything.
- Client side navigation keeps the position without a URL.

**Cons**:
- Lost on refresh and on a direct visit to `/generate`, so it needs a fallback anyway, which means
  two code paths for the same state.
- A provider whose only job is to hold one integer is the most machinery for the least result.
- Splits state ownership across two routes for a value only one route reads.

## Decision

**Chosen option**: Option 1: two routes, with the flow position local to the generator.

Build `/` as the landing page and `/generate` as the flow, with the start control navigating
between them. Hold the flow position as one integer in the generator page's own component state,
starting at 1.

Share the shell through a route group. `app/(site)/layout.tsx` is a server component that composes
`Header` and `Footer` around its children, and both routes live inside it, so neither can forget
the shell or drift from the other.

## Rationale

The reference app's flow position is one `useState` integer in the component that renders the
whole page. Splitting the page in two is what breaks it, so the mechanism that replaces it is the
real decision here, and Option 1 is the only option that leaves features 4 to 8 shaped like the
code they are porting. Every transition in the reference is `setStep(n)`, an instant state change
with no navigation. Options 2 and 3 both turn that into something else: Option 2 makes every
transition a navigation, and Option 3 puts the integer in a provider that only one route reads and
that still loses the value on refresh. Neither buys anything the scope asked for. The one thing
Option 1 gives up, a refresh mid flow, is exactly what the reference gives up too, so this is
parity rather than a regression.

Dropping the step 0 prompt card follows from the split rather than fighting it. Its copy reads
"Click the button above to start uploading your template and names file", and the button it
points at is the hero's. Once the hero lives on `/` and the flow on `/generate`, there is no button
above. The card was the landing page's job, describing the choice someone has not made yet, and the
landing page now does that with a real control instead of a sentence about a control.

The route group is the right home for the shell. Composing the header and footer inside each route
would work today and then quietly rot, because a route added later has to remember a convention
rather than inherit it. The group makes the shell structural. One thing it cannot do is cover the
unknown path page: an unmatched URL renders inside the root layout only, never inside a route group
layout, so `app/not-found.tsx` composes the header and footer itself. That is stated in the surface
table so nobody discovers it as a surprise.

On the header, the theme control goes after Login in the right hand group. It keeps the header to
two groups, wordmark on the left and everything interactive on the right, and it sits with the
other controls rather than splitting the bar. Spec 0002's acceptance criteria say that placing the
control in a header is all the shell has to do, so this closes that follow up and makes the
control verifiable for the first time.

The header is a client component because `ThemeToggle` is, not because of the alerts. Worth stating
plainly, because it means the `alert()` handlers cost nothing extra and would not by themselves
have forced it.

On the header's narrow screen behaviour, the engineer chose exact parity: a single flex row with no
breakpoint, crowding at phone widths exactly as the reference does. That is the right call for a
foundation feature, because a responsive header would be a design decision made before any real
content sits in it, and it would be re-decided later. The step row is new and has no parity
constraint, so it stacks into a single column at the `sm` breakpoint, which costs one flex direction
and no component.

On the landing page, the engineer chose restraint over the two richer directions offered: no fanned
certificate stack, no ruled form mockup, just the hero and the step row. That is a legitimate
choice and the skill guidance behind it is right, that restraint needs precision rather than
absence. So the page is quiet and the type does the work. Nunito, the rounded friendly serif,
carries the headline, which is an odd choice for a formal document product and that tension is the
interesting part. Outfit stays on body and UI, and JetBrains Mono carries the eyebrow in small
uppercase, which reads like a form being filled in.

The one creative liberty the landing page takes is the five step row, which the reference does not
have. It is the right liberty because the five steps are a genuine ordered sequence, which is the
only honest reason to number anything, and because it tells a first time visitor what they are
about to do. It is also bounded: static labels rather than links, since none of those screens exists
until features 4 to 8.

One deliberate consequence of the base sera design system is that casing changes. The reference's
Login button, nav links and hero CTA use sentence case, and base sera's Button and Badge are
`text-xs uppercase tracking-widest` with square corners. This spec accepts that on all three
controls. It is the design system exception the parity rule already allows, and fighting it with
per component overrides would put this spec at odds with all 61 generated components.

The unknown path page belongs here rather than later. Route shape is this feature's job, and the
fault was found while verifying this feature's predecessor. Shipping a known broken unknown path
page while reshaping the routes would be leaving a fault in place on purpose. Adding
`app/not-found.tsx` built from the same tokens fixes it, and it also replaces the framework page's
`system-ui` font with Outfit, so the dead end stops looking like a different website.

## Feature design

**Data model sketch**: no database, no server, no account, nothing persisted. One piece of client
state exists in this feature, and features 4 to 8 extend it.

| State | Type | Owner | Initial | Lost on |
|---|---|---|---|---|
| Flow position | `number`, 1 to 5 | `/generate` page component, `useState` | `1` | refresh, and any full page load |
| Footer year | `number` | computed in `app/(site)/layout.tsx`, passed to `Footer` as a prop | current year at render | corrected after mount if stale |

Nothing derived is stored and nothing is written to storage or the URL. The flow position exists to
decide which step component renders, and features 4 to 8 add the uploaded file, the parsed
recipients and the generated PDFs alongside it in the same component, exactly as the reference holds
them.

**State transitions**: for this feature there is one transition, arrival.

```
event              flow position   what /generate shows
first render       1               the placeholder flow region
features 4 to 8    1 to 5          the matching Step component
```

Each step's Next and Edit setting the position is features 4 to 8's work, not this feature's. The
reference moves between positions with `setStep(n)` and nothing else, and this spec keeps that.

**API surface**: a route group, three shell components, and the unknown path page. No endpoint, no
server action.

| Route or export | Kind | Notes |
|---|---|---|
| `app/(site)/layout.tsx` | server component | Composes `Header` and `Footer` around `children`, and computes the footer year. Owns the shell for both routes. |
| `app/(site)/page.tsx` | server component | The landing page: hero and step row. Stays indexable. |
| `app/(site)/generate/page.tsx` | client component | Holds the flow position. Renders the placeholder flow region. |
| `app/(site)/generate/layout.tsx` | server component | Owns `title` and `robots` for this segment. It must be a server component because Next.js only supports the `metadata` export in server components, and the page below it is a client component. |
| `app/not-found.tsx` | server component | Composes `Header` and `Footer` itself, because an unmatched URL renders inside the root layout only and never inside a route group layout. |
| `components/header.tsx` | client component | Forced by `ThemeToggle`, not by the alerts. No props. |
| `components/hero.tsx` | server component | No props and no handlers. Its start control is a link. The Button inside it is `'use client'`, so `/` is not fully server rendered. |
| `components/footer.tsx` | client component | Receives `year` as a prop and corrects it after mount. No other props. |

`app/page.tsx` at the repository root is deleted, because a root `page.tsx` and a `(site)/page.tsx`
both resolve to `/` and Next.js rejects the conflict.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Rendering `/` | The header, hero, step row and footer | The `(site)` layout for the shell, the page for the hero and step row |
| Rendering `/generate` | The flow region | The placeholder, replaced wholesale by feature 4 |
| The wordmark text | `Veni` | The branding rule in `AGENTS.md`, which fixes the name |
| The wordmark destination | `/` | This spec, because there are now two routes |
| The wordmark icon | Which lucide icon | The reference app's scroll glyph, swapped for `lucide-react`'s `Scroll`, per the design system rule against emoji |
| The eyebrow text | `Instant Bulk Certificate Generation & PDF Export` | The reference app's `Hero.tsx` badge, verbatim, minus the emoji |
| The eyebrow icon | Which lucide icon | The reference app's lightning bolt glyph, swapped for lucide's `Zap` |
| The eyebrow surface | `bg-primary/10`, `text-primary`, `border-primary/30` | The reference's `#aa3bff` at three opacities, mapped onto the primary token. No raw colour, per AC-18 |
| The headline | `Generate Certificates in Seconds` | The reference app's `Hero.tsx`, verbatim |
| The subtitle | The two reference lines | The reference app's `Hero.tsx`, verbatim, including the `br` |
| The start control label | `Start Generating` | The reference app's `Hero.tsx`, verbatim |
| The start control destination | `/generate` | This spec |
| The five step labels | `Template upload`, `Names upload`, `Position and name formatting`, `Preview and generate`, `Download the batch` | The scope's own feature names in `docs/scope/scope.md`, not invented |
| The step numerals | `1` through `5`, preceding each label | This spec, because the sequence is real and that is the only honest reason to number |
| The step order and breakpoint | One to five left to right, one per line at `sm` and below | The scope's slice order, and Tailwind's default `sm` |
| The flow region container | `max-w-3xl mx-auto py-16 px-4 flex flex-col gap-8` | The reference app's `#generator-flow` section classes, ported as they are |
| The landing container | `max-w-3xl mx-auto` | The reference's own content width, so the step row lines up with where the flow will sit |
| The Pricing alert | `Pricing plans coming soon!` | The reference app's `Header.tsx`, verbatim |
| The Docs alert | `Documentation coming soon!` | The reference app's `Header.tsx`, verbatim |
| The Login alert | `Login modal coming soon!` | The reference app's `Header.tsx`, verbatim |
| Nav item styling | `text-muted-foreground` base, `hover:text-foreground` | The reference's `#6b6375` base and near black hover, mapped onto tokens |
| Login styling | `Button variant="outline"` | The reference's bordered button, expressed in this design system's one outlined variant |
| The header bar | `sticky top-0 z-50`, `border-b border-border`, `bg-background` | The reference's own header classes, ported. The background must be the opaque token, not a translucent modifier, or content scrolling underneath shows through a sticky bar |
| The footer bar | `border-t border-border`, `text-muted-foreground` | The reference's own footer classes, mapped onto tokens |
| The footer year | The current four digit year | `new Date().getFullYear()` in the server layout, passed as a prop, corrected in an effect after mount |
| The footer text | `© <year> Veni. All rights reserved.` | The reference app's `Footer.tsx`, with the name rebranded |
| The placeholder copy | The heading and body in the block below | Written out in this spec, since it is displayed text |
| The unknown path copy | The heading and body in the block below | Written out in this spec, since it is displayed text |
| The applied colour on any route | The class on the html element | The `veni-theme` provider from spec 0002, which owns it |
| The theme control's own rendering | Icon, accessible name, mounted guard | `components/theme-toggle.tsx`, built by spec 0002 and not changed here |
| Page title and description | The metadata strings | The block below, drafted and flagged for the engineer's review |
| The unknown path page's colours | Background, text, border | Theme tokens, which is what makes AC-16 work |

**Displayed copy**, drafted here so the build never has to invent it. The flow region placeholder:

> **The certificate flow lands here**
> The five steps, from template upload to the finished ZIP, arrive in the next features of this
> build.

The unknown path page:

> **That page does not exist**
> The link may be mistyped, or the page may have moved. Start again from the beginning.

Both are written in the product's voice, in sentence case, and both are plain about the state of
the build rather than pretending to be finished product.

**Metadata**, replacing the scaffold values in `app/layout.tsx`. The title and description are
drafted copy, so they are put here in full for the engineer to correct rather than left for the
build to guess:

```
title: Veni, bulk certificate generator
description: Upload one certificate template and a list of names, position the name on the page,
  then download a ZIP of hundreds of personalised certificates as PDFs. Everything runs in your
  browser, so no file ever reaches a server.
openGraph.siteName: Veni
openGraph.title: Veni, bulk certificate generator
openGraph.description: the same description as above
twitter.card: summary
twitter.title: Veni, bulk certificate generator
twitter.description: the same description as above
```

`app/(site)/generate/layout.tsx` adds `title: Generate certificates, Veni` and
`robots: { index: false }`. `follow` is left alone: the route is on the same site, and blocking
follow would stop a crawler reading the landing page from it. The reference app has no per route
metadata to copy, so these strings are the drafted part.

**Key invariants**:
- The `dark` variant still keys off the `.dark` class, and nothing in this feature writes that class.
  The provider from spec 0002 owns it, including on the unknown path page.
- The html element keeps `suppressHydrationWarning` and the class list stays free of `dark`.
  The unknown path page must not reintroduce either.
- No raw colour in any new component. The reference app's `#aa3bff` becomes `bg-primary`, its
  `#6b6375` becomes `text-muted-foreground`, its `#2e303a` becomes `border-border`, per the mapping
  `AGENTS.md` already records.
- Six strings are verbatim from the reference and are not to be reworded: the three alert strings,
  the headline, both subtitle lines, and the eyebrow. A reword in any of them is a parity break.
  The footer copy is the seventh, modulo the name.
- Internal navigation uses `next/link`. The wordmark, the start control and the unknown path link
  are links, never buttons with click handlers.
- The start control sets `nativeButton={false}` on the Button primitive. base-ui's default of true
  puts `type="button"` onto an anchor and raises a development error.
- The footer's first client render uses the `year` prop, never a fresh `new Date()`, or hydration
  mismatches.
- No emoji in any file this feature touches.
- Both routes stay statically prerendered, so nothing reads storage, a cookie or a request header
  during render.
- The step row is not a set of links, and stays that way until the steps it names exist.
- `components/theme-toggle.tsx` is not modified and not re exported from anywhere new.

**Security model**: not applicable. No data, no auth, no accounts, and nothing that identifies a
visitor. The Login control is a placeholder that alerts, exactly as in the reference, and it is not
a security boundary because it does nothing. No personal data and no regulated category is touched.
One consequence worth stating: with scripting off, `alert()` cannot fire, so Pricing, Docs and Login
do nothing at all. That is inherent to keeping the reference's `alert()` behaviour, which the
parity rule requires, and it affects three placeholder links only.

**Configuration required**: none. No environment variables, no credentials, no third party account,
and no new dependency. Everything this feature uses is already installed.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: `/` shows the wordmark, the three nav items, the theme control, the hero and the five
  numbered step labels; `Start Generating` lands on `/generate`; the header and footer are on both.
  Verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-7**, **AC-8**, **AC-9**
- Parity alerts: Pricing, Docs and Login each fire their exact reference strings, and Pricing and
  Docs do not navigate. Verifies **AC-5**
- Theme control live: the header control changes the palette of whichever route it is on, and the
  choice survives a reload. Verifies **AC-6**
- Narrow screens: the header stays one row at phone width, and the step row becomes one numbered
  label per line at `sm` and below. Verifies **AC-10**, **AC-11**
- The year: the footer shows the current year, the first client render matches the server's value
  with no hydration warning in the console, and a stale build's year corrects after mount.
  Verifies **AC-12**
- Unknown path, both directions: with the choice light on a dark machine the unknown path page is
  light with the header and footer present, and with the choice dark on a light machine it is dark.
  Verifies **AC-16**
- Metadata and indexing: the browser tab and a shared link show the Veni title, no `Create Next App`
  survives in the metadata, and `/generate` asks not to be indexed while `/` stays indexable.
  Verifies **AC-14**, **AC-15**
- Regression guard: `pnpm build` passes with both routes static, `pnpm lint` is at the baseline, and
  `pnpm test` passes. Verifies **AC-17**, **AC-19**

## Build plan

The project builds by Tracer Bullet, a thin slice proved end to end before the next one thickens
it. For this feature that means the group layout, both routes and the three shell components
standing up together, so the whole path from landing to generator is real and clickable, before any
of the visual detail is refined. If the split is wrong, it is wrong with six files rather than with
a finished landing page.

- [x] 1. Create the route group and both routes with the shell stubbed: `app/(site)/layout.tsx`
      composing `Header` and `Footer` around `children`, `app/(site)/page.tsx`,
      `app/(site)/generate/page.tsx` as a client component holding one `useState` integer
      initialised to 1, and `app/(site)/generate/layout.tsx` as a server component exporting `title`
      and `robots`. Create `components/header.tsx`, `components/hero.tsx` and `components/footer.tsx`
      with no props, and delete the root `app/page.tsx`, which would otherwise collide with
      `(site)/page.tsx` over `/`, satisfies **AC-2**, **AC-17**
- [x] 2. Prove the thin slice before any styling beyond the tokens: both routes render with the shell
      present and the start control crossing from `/` to `/generate`, in development and in a
      production build with both routes still `(Static)`, satisfies **AC-1**, **AC-7**, **AC-8**
- [x] 3. Fill in `Header`: wordmark as a `Link` to `/` reading `Veni` with a lucide `Scroll`, then the
      right hand group of Pricing, Docs, Login and `ThemeToggle` in that order. Nav items as
      `text-muted-foreground` with `hover:text-foreground`, Login as `Button variant="outline"`,
      each firing its exact reference alert string. The bar itself `sticky top-0 z-50` with
      `border-b border-border` and the opaque `bg-background`, satisfies **AC-3**, **AC-4**,
      **AC-5**, **AC-6**
- [x] 4. Fill in `Hero`: the eyebrow as a `Badge` reading `Instant Bulk Certificate Generation & PDF
      Export` on `bg-primary/10 text-primary border-primary/30` with a lucide `Zap`, in
      `font-mono text-xs uppercase`; the Nunito headline; the two line subtitle with its `br`; and
      `Start Generating` as a `Button` whose `render` prop is a `Link` to `/generate`, with
      `nativeButton={false}`, satisfies **AC-7**, **AC-8**, **AC-13**
- [x] 5. Fill in `Footer`: compute the year in `app/(site)/layout.tsx`, pass it in, render the
      copyright line, and correct the year in an effect after mount. The first client render uses the
      prop so hydration matches, satisfies **AC-12**
- [x] 6. Replace the landing page body: the hero plus the five step row inside a
      `max-w-3xl mx-auto` container, a static list of the scope's five step names each preceded by
      its numeral, a horizontal flex row that becomes one column at `sm` and below, satisfies
      **AC-9**, **AC-10**, **AC-11**
- [x] 7. Add `app/not-found.tsx`, composing `Header` and `Footer` itself since an unmatched URL
      renders inside the root layout only, with the drafted heading and supporting copy, a link back
      to `/`, and no raw colours, satisfies **AC-16**, **AC-18**
- [x] 8. Replace the scaffold metadata in `app/layout.tsx` with the title, description, Open Graph and
      Twitter values in Feature design, and set the title and `robots: { index: false }` in
      `app/(site)/generate/layout.tsx`, satisfies **AC-14**, **AC-15**
- [x] 9. Run `pnpm build`, `pnpm lint` and `pnpm test`, confirm both routes still show `(Static)` and
      that no lint finding sits in a file this feature owns. Note that `app/layout.test.tsx` only
      asserts the metadata title and description are strings, so task 8 will not break it, satisfies
      **AC-19**

## Consequences

**Positive**:
- The app stops being the Next.js starter page. `/` becomes the product.
- The theme control gets a home, so dark mode is reachable from the interface for the first time
  and spec 0002's control becomes verifiable.
- The unknown path page stops ignoring the visitor's colour choice, which was the one real fault
  verification found.
- Real metadata lands, so a shared Veni link stops showing `Create Next App` in the tab and in
  search results.
- The shell is structural rather than a convention, so a route added later cannot forget it.
- The five step row tells a first time visitor what they are about to do, and sets up features 4 to
  8 by naming their screens before they exist.
- The flow position stays exactly where the reference has it, so the remaining port is a
  transcription rather than a redesign.

**Negative / tradeoffs**:
- The landing page is a departure from parity. The reference has one page and a bare hero; this has
  two routes, a route group, a step row, real metadata and an unknown path page. That is the largest
  single departure the port has taken, and it was the engineer's explicit call.
- Base sera's `text-xs uppercase tracking-widest` and square corners replace the reference's sentence
  case and `rounded-lg` on the nav links, the Login button and the hero CTA. Every control in the app
  will read that way, so this is consistency rather than an isolated quirk, but it is still visible
  drift from the reference.
- The header keeps the reference's lack of narrow screen handling, so it will crowd at phone widths.
  That is chosen parity, but it is a real rough edge that a later slice may have to fix, and fixing
  it then becomes a visible change to the shell.
- A refresh mid flow loses the position and any uploaded file. The reference loses them too, so this
  is parity, but it is the cost of Option 1 and a bulk job interrupted by a stray refresh restarts.
- The five step row is static, so it cannot be clicked. Once features 4 to 8 land, the row becomes
  either misleading or a dead control, and someone has to decide whether to link it or drop it.
- With scripting off, the three nav alerts do nothing, since `alert()` needs scripting. Keeping the
  reference's `alert()` was required, so this is accepted rather than fixed.
- `/generate` is a client page because the flow position is client state, so the generator route and
  everything under it is client rendered. It still prerenders static, so this costs no server work.
- The hero's own markup is a server component, but its Button is `'use client'`, so `/` is not fully
  server rendered either. Worth knowing before someone assumes the landing page ships no JavaScript.
- The footer needs an effect and a prop to stay correct across a stale build. A one line year became
  three moving parts, because a client component's render is baked into the static output exactly as a
  server component's is.
- `app/not-found.tsx` composes the shell by hand, which is the one place the route group does not
  reach. If the shell's composition ever changes, that file has to change with it.

**Neutral**:
- No new dependency, and no file in `app/globals.css` changes.
- The empty `.ticks` div from the reference is dropped. It had no content and no styling of its own.
- The reference's `min-h-screen` wrapper has no port, because the root layout's body already carries
  `min-h-full` and a flex column.
- No certificate step is built here. Features 4 to 8 own all five.
- The favicon is still the Next logo. See Follow-up.

## Follow-up

- [ ] Spec 0002's follow up is discharged by this feature: `ThemeToggle` now has a home in the
      header. `/state-sync` should record that the control is rendered, not an unused export, when
      this lands.
- [ ] The step row becomes stale the moment features 4 to 8 exist, since it will name screens that
      are real and not link to them. Decide then whether to link each step or drop the row. Not a
      decision for this feature.
- [ ] The metadata wording, the placeholder copy and the unknown path copy in Feature design are
      drafted, not engineering input. Correct anything that reads wrong; nothing depends on the exact
      strings.
- [ ] `app/favicon.ico` is still the Next logo and `public/next.svg` and `vercel.svg` are still the
      Next defaults. AC-14 covers metadata only, so the favicon is deliberately out of scope here.
      Replacing it needs an icon asset, which is the engineer's to supply.
- [ ] Pure parity for the header crowding was tried first and produced a real defect, so the header
      now wraps as a unit. At 390 pixels the reference's single row makes the wordmark and the first
      nav item touch, and adding a gap alone pushed the bar 14 pixels past the viewport. The shipped
      fix is `flex-wrap` plus `gap-x-6` on the header and `ml-auto` on the nav: identical to the
      reference above 640 pixels, and the nav drops to a second right aligned row below it. This is a
      deviation from AC-11's letter. Reverting it means accepting the collision.
- [ ] Pricing and Docs keep `href="/"` rather than the reference's `#pricing` and `#docs` fragments,
      because those point at nothing here and Biome's `useValidAnchor` rejects a bare fragment. The
      default is always prevented, so nothing navigates either way and the alerts are unchanged.
- [ ] The step numerals render zero padded as `01` to `05`, which the spec's Value sourcing records as
      `1` through `5`. The padding lines the column up in the mono face. One character to reverse.
- [ ] The `frontend-design` skill is installed at the user level and is what shaped the landing
      page's restraint, the Nunito headline and the mono eyebrow. Root `AGENTS.md` has no
      `## Agent skills` bullet for it, only for `tailwindcss`. Its conventions are project wide
      rather than area specific, so it belongs at root level.
- [ ] There is still no `app/error.tsx` or `app/global-error.tsx`. A render error in the generator flow
      would hit the framework's own error page, which would ignore the chosen colour exactly as the
      unknown path page did. Worth its own decision when the flow exists.
- [ ] The 404 fault was found while verifying feature 2, but feature 2's `Verify it` box is unticked
      and spec 0002 does not record it. If feature 2 is ever verified, that finding belongs in its run
      record rather than only here.