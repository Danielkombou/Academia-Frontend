# Scope: Veni

Veni is a bulk certificate generator. Teachers, event organisers and organisations upload
a certificate template, upload a list of recipient names, position the name on the page,
preview it, then download hundreds of personalised certificates as a ZIP. Everything runs
in the browser, so no file ever reaches a server.

This is a port of the existing React app at `~/Projects/veni-react`, which stays the
reference implementation. The Next.js version is called Veni and uses the Veni theme
rather than the old purple one; those two differences are the only deliberate departures
from the reference.

**Build approach:** Tracer Bullet (prove each thin slice end to end against a known good
reference before starting the next one).
**Workflow:** Beta (verify on the real app, then write a test suite). The project default
level of rigor. `/solution-architect` is the recommended first stop for a feature with a
real decision, but skippable when you already know the build. Any feature can carry its
own tag to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything
that does not fit: if you already know how to build a feature, use `/feature-build` and
skip `/solution-architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Stack and tooling | Foundation | existing |
| B | Project context | Foundation | existing |
| 1 | Veni theme and typography | Foundation | done |
| 2 | Theme provider and dark mode toggle | Foundation | in-progress |
| 3 | Route shape and app shell | Foundation | in-progress |
| 4 | Template upload | Slice 1 | in-progress |
| 5 | Names upload | Slice 2 | in-progress |
| 6 | Position and name formatting | Slice 3 | in-progress |
| 7 | Preview and generate | Slice 4 | in-progress |
| 8 | Download the batch | Slice 5 | done |
| 9 | Full parity proof | Proof | done |

## Foundations

### A. Stack and tooling · existing

Next.js 16 App Router scaffold with TypeScript strict, Tailwind 4, Biome, and shadcn on
the base-sera style with one Button component. code in `./`

### B. Project context · existing

The parity rule against the React app, the Veni branding and theme decisions, the
Next.js porting gotchas, and the naming rules for the product. code in `AGENTS.md`

### 1. Veni theme and typography · done

Apply the green Veni theme and the Outfit, Nunito and JetBrains Mono fonts so the app stops rendering
the stock taupe shadcn palette, without breaking the tokens shadcn's own components rely on.
**Done when:** the green primary, the 0.725rem radius and the three fonts render from
`app/globals.css` and `app/layout.tsx`; every shadcn component still resolves its tokens, including
the opacity modifiers; `pnpm build` passes.
spec [0001](../specs/0001-veni-theme-and-typography/index.md) · code in `app/globals.css`, `app/layout.tsx`, `components.json`
- [x] Design it (spec): `/solution-architect Veni theme and typography`
- [x] Build it: `/feature-build Veni theme and typography`
  - [x] Token values and font loaders in place (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-9)
  - [x] Theme proved on a throwaway route showing every Button variant and size (AC-1, AC-6, AC-7)
  - [x] Chart and sidebar tokens, base layer and `components.json` settled (AC-2, AC-11, AC-12)
  - [x] Both modes checked by hand, build and lint green (AC-8, AC-9, AC-10)
- [x] Verify it: `/verify-release Veni theme and typography`
- [x] Test it: `/test-engineer Veni theme and typography`

### 2. Theme provider and dark mode toggle · in-progress

Dark mode follows the operating system by default and can be overridden from a header
control, remembered between visits. It moves into user settings later, once accounts
exist.
**Done when:** dark mode applies before first paint with no white flash; the header
control switches between light and dark and the choice survives a reload; no control
renders before the provider is mounted.
spec [0002](../specs/0002-dark-mode-provider-and-toggle/index.md) · code in `app/layout.tsx`, `components/providers/theme-provider.tsx`, `components/theme-toggle.tsx`, `vitest.setup.ts`, `components/ui/dropdown-menu.tsx`
- [x] Design it (spec): `/solution-architect theme provider and dark mode toggle`
- [x] Build it: `/feature-build theme provider and dark mode toggle`
  - [x] Dependency, provider wrapper, root layout wiring and the media query stub (AC-1, AC-2, AC-9, AC-14, AC-16)
  - [x] Thin slice proved on a throwaway route: no flash, class on the html element, choice survives a reload (AC-1, AC-2, AC-4)
  - [x] Real control built: dropdown trigger, radio group of three items, mounted gate and placeholder (AC-3, AC-4, AC-5, AC-12)
  - [x] Trigger icon showing the applied theme, tooltip and accessible name, and the dot in the shared menu item (AC-5, AC-15)
  - [x] Whole feature proved on the throwaway route, route deleted, build, lint and test green (AC-2, AC-6, AC-7, AC-8, AC-11, AC-13, AC-16)
- [ ] Verify it: `/verify-release theme provider and dark mode toggle`
- [ ] Test it: `/test-engineer theme provider and dark mode toggle`

### 3. Route shape and app shell · in-progress

Split the React app's single scrolling page into a landing page at `/` and a generator
at `/generate`, and build the shared Header, Hero and Footer on shadcn.
**Done when:** `/` shows the hero and the start control, `/generate` shows the flow, the
header and footer appear on both, and the Pricing, Docs and Login links still alert
exactly as they do today.
spec [0003](../specs/0003-route-shape-and-app-shell.md) · code in `app/(site)/`, `app/not-found.tsx`, `app/layout.tsx`, `components/header.tsx`, `components/hero.tsx`, `components/footer.tsx`
- [x] Design it (spec): `/solution-architect route shape and app shell`
- [x] Build it: `/feature-build route shape and app shell`
  - [x] Route group, both routes and the three shell components created, root `app/page.tsx` deleted (AC-2, AC-17)
  - [x] Thin slice proved end to end with both routes still prerendered static (AC-1, AC-7, AC-8)
  - [x] Header and Hero filled in, including the three alert strings and the theme control's home (AC-3, AC-4, AC-5, AC-6, AC-13)
  - [x] Footer year mechanism and the five step row on the landing page (AC-9, AC-10, AC-11, AC-12)
  - [x] Unknown path page, real metadata, and build, lint and test green (AC-14, AC-15, AC-16, AC-18, AC-19)
- [ ] Verify it: `/verify-release route shape and app shell`
- [ ] Test it: `/test-engineer route shape and app shell`

## Slice 1: Template upload

### 4. Template upload · in-progress

Accept PNG, JPG and PDF templates, rasterise the first PDF page at 300 DPI, cap the
embedded resolution, and alert on a file that will not load. Installs `pdfjs-dist`, and
settles the client boundary and worker wiring that the later slices follow.
**Done when:** a PNG, JPG or PDF template loads and previews at the same dimensions and
aspect ratio as the React app; a PDF uses its first page; anything over the resolution cap
is downscaled to the same cap; a file that will not load clears the state and alerts.
spec [0004](../specs/0004-template-upload-and-client-boundary/index.md) · code in `app/(site)/generate/page.tsx`, `components/step-template.tsx`, `lib/templateUtils.ts`, `lib/pdfClient.ts`
- [x] Design it (spec): `/solution-architect template upload`
- [x] Build it: `/feature-build template upload`
  - [x] Worker recipe spiked and the thin slice standing: pdfjs installed and pinned, the worker proven on throwaway code, then the image path, the page's state, the card and the alert (AC-2, AC-4, AC-6, AC-7, AC-10, AC-11, AC-12, AC-13)
  - [x] PDF path added and proved against the reference app's own output (AC-3)
  - [x] Step card completed: Continue and the summary row, the inert cards for steps 2 to 5, the thumbnail, and real drop handling (AC-1, AC-5, AC-8, AC-9, AC-14, AC-15)
  - [x] Card states, keyboard access and tokens finished, with no raw colour and no emoji (AC-16, AC-17, AC-18, AC-19)
  - [x] Pure helpers and the card's failure and retry paths tested, then build, lint and test green (AC-20, AC-21)
- [x] Verify it: `/verify-release template upload`
- [ ] Test it: `/test-engineer template upload`

## Slice 2: Names upload

### 5. Names upload · in-progress

Read CSV, TXT and DOCX name lists, strip leading numbering such as `1. Name`, and show
the file name and recipient count. Installs `mammoth` for DOCX.
**Done when:** a plain list and a CSV with headers both parse to the same recipients as
the React app; leading numbering is stripped; a DOCX yields its text; an unreadable DOCX
alerts.
code in `app/(site)/generate/page.tsx`, `components/step-names.tsx`, `lib/namesUtils.ts`, `lib/docxClient.ts`, `mammoth-browser.d.ts`
- [x] Build it: `/feature-build names upload`
  - [x] `mammoth` installed and pinned, its browser build wired behind a dynamic import, and the browser type declaration ported
  - [x] `lib/namesUtils.ts` with the pure parsing transcribed from the reference: `cleanName`, `isDocxFile` and `parseNamesText`, unit tested against the reference's own output
  - [x] Page state, the pick handler with its token, and step 2 standing as a real card with the inert cards for steps 3 to 5 below it
  - [x] A real DOCX proved end to end against the reference's own parse, the unreadable DOCX alert proved, and the mammoth chunk confirmed absent until a DOCX is attempted
  - [x] Pure helpers and the card's paths tested, then build, lint and test green
- [x] Verify it: `/verify-release names upload`
- [ ] Test it: `/test-engineer names upload`

**Verified 2026-10-06, PASS after a fix.** The first pass failed on two behaviours, both
fixed by setting the file name when the pick is accepted rather than after the parse
succeeds (see the note below). Both apps were driven live with the same
fixtures (Veni on :3000, the reference on :5173). Parsing matches the reference exactly on
every input tried: a plain numbered list, a CSV with headers, a real DOCX, an uppercase
`.DOCX`, `1)` and `2.` and `3)` and `10.` numbering, quoted names, CRLF endings, blank lines
between names, a two column CSV, and a quoted header row. The mammoth chunk is absent from
the first load and after a TXT, and one 296 KB chunk appears only on a DOCX attempt, so the
on demand boundary holds. Two behaviours differed from the reference on the first pass, both
about what the card shows after a file it could not use. Both are now fixed and hold:

1. An unreadable DOCX alerts with the reference's exact string in both apps, and both keep
   `Selected: <name>` on screen.
2. An empty file shows `Selected: <name>` in both and keeps the demo recipients.

Same cause for both: Veni set the file name only after a parse succeeded, while the
reference sets it the moment a pick is accepted, before the read. Fixed in one place,
`handleNamesPick` in `app/(site)/generate/page.tsx`: `setSpreadsheetFile` now runs as the
pick is accepted and the `setSpreadsheetFile(null)` is gone from the catch. The template
handler above keeps its clear on failure, because the reference clears the template there
too, so the two steps now differ on purpose. The three assertions in
`app/(site)/generate/page.names.test.tsx` that pinned the old behaviour now pin this one,
and a fourth test covers the empty file case.

## Slice 3: Position and name formatting

### 6. Position and name formatting

The step where the user sets the name position, font size, colour, and how many name
parts show in full against how many become initials.
**Done when:** position is set as a percentage of the template and the default position,
size and colour match the React app; the formatting options produce identical output for
identical input, including `jean paul kombou` becoming `Jean Paul K.`.
spec [0006](../specs/0006-position-and-name-formatting.md) · code in `app/(site)/generate/page.tsx`, `components/step-position.tsx`, `lib/nameFormat.ts`
- [x] Build it: `/feature-build position and name formatting`
  - [x] `lib/nameFormat.ts` with the pure formatting transcribed from the reference
  - [x] `components/step-position.tsx` with name column picker, formatting options, color picker and vertical position slider
  - [x] Page state wired and the card standing with inert cards for steps 4 and 5 below it
  - [x] Build, lint and test green

## Slice 4: Preview and generate

### 7. Preview and generate · in-progress

Mirror the output in the live preview, then generate one PDF per recipient at the page
size the template aspect ratio implies. Installs `jspdf`. This is where the port's
performance risk lives, since every PDF is held in memory (basis: holding hundreds of
generated PDFs in browser memory is the known ceiling the reference app warns about).
**Done when:** the preview matches the generated page for position, font, size and colour;
page size and orientation follow the template aspect ratio with a 297mm long edge;
progress is reported while generating; the reference app's memory alert appears on
failure.
spec [0007](../specs/0007-preview-and-generate.md) · code in `app/(site)/generate/page.tsx`, `components/step-preview.tsx`, `lib/pdfGenerate.ts`
- [x] Design it (spec): `/solution-architect preview and generate`
- [x] Build it: `/feature-build preview and generate`
  - [x] Thin slice: preview with font selector (AC-1, AC-9)
  - [x] Generation logic with PDF template rendering and pdfjs (AC-2, AC-3, AC-7, AC-8)
  - [x] Page wiring, progress, OOM heuristic, cancellation (AC-4, AC-5, AC-6)
  - [x] Polish, keyboard access, tokens, verify against reference (all ACs)
- [x] Verify it: `/verify-release preview and generate`
- [x] Test it: `/test-engineer preview and generate`

## Slice 5: Download the batch

### 8. Download the batch · in-progress

Download the whole batch as a ZIP, streaming straight to disk where the browser supports
it, and offer a single PDF download alongside it. Installs `jszip`.
**Done when:** the archive is named `Certificates_Batch.zip` and holds one
`Certificate_<name>.pdf` per recipient with the same sanitised names as the React app;
streaming is used where supported and falls back cleanly where it is not; a single PDF
downloads on its own; the start over control clears the flow.
spec [0008](../specs/0008-download-the-batch.md) · code in `app/(site)/generate/page.tsx`, `components/step-done.tsx`, `lib/zipUtils.ts`
- [x] Design it (spec): `/solution-architect download the batch`
- [x] Build it: `/feature-build download the batch`
  - [x] Zip utilities with CRC32, streaming, fallback (AC-1, AC-2, AC-3, AC-7, AC-8)
  - [x] StepDone component with Veni theming (AC-4, AC-5, AC-6)
  - [x] Page wiring, streaming + fallback, reset (AC-1, AC-2, AC-3, AC-5, AC-7, AC-8)
  - [x] Polish, keyboard access, tokens, verify against reference (all ACs)
- [x] Verify it: `/verify-release download the batch`
- [x] Test it: `/test-engineer download the batch`

## Proof

### 9. Full parity proof · done

Run the same template, same names file and same settings through both apps and compare
the results, so the port is proven rather than assumed.
**Done when:** the same input produces the same recipients, the same preview, and the
same ZIP file names and page sizes in both apps; every difference found is either fixed
or written down as an accepted departure.
- [x] Build it: `/feature-build full parity proof`

## Deferred

Out of scope for the current build pass, kept so the plan stays honest.

- **Accounts and user settings**: sign in, and the theme control moves into settings ·
  needs a decision · GA
- **Privacy and terms pages**: short legal pages for a public launch
- **Accessibility pass**: labels, focus order, contrast on the green, keyboard use of the
  position controls
- **Pricing and paid tiers**: the Pricing link keeps its placeholder alert · needs a
  decision
- **Product analytics**: none chosen for now
- **Error boundaries**: no `app/error.tsx` or `app/global-error.tsx`, so a render error in the
  generator flow hits the framework's own page, which ignores the chosen colour the same way the
  unknown path page did · from spec 0003, worth doing once the flow exists
- **Branding leftovers**: `app/favicon.ico` is still the Next logo and `public/next.svg` and
  `vercel.svg` are still the Next defaults · from spec 0003, needs an icon asset from the engineer

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends
with `(spec)`. Its wording varies (`Design it (spec)` normally), so skills locate it by
that `(spec)` suffix, never by an exact label. Every other box is an execution box and
`/solution-architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and
who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope-plan` | one box: `Design it (spec): /solution-architect <feature>` |
| `in-progress` (designed) | **`/solution-architect` at spec capture** | `Design it` ticked; spec linked; `Build it: /feature-build <feature>` + **2 to 5 milestones**; the tier's closing boxes (`Verify it` Alpha+, `Test it` Beta+); any surfaced follow-up enrolled |
| `in-progress` (building) | `/feature-build` | milestone sub-boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/verify-release` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | **you, when you decide it is**; `/state-sync` reconciles | boxes you ran ticked, skipped ones marked skipped; the tier's last stage is the suggested point to call it done; `/state-sync` captures conventions |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/solution-architect` first; otherwise straight to
  `/feature-build`. The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries
  only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre-workflow) and
  `dropped` (de-scoped, kept for history).
- **Workflow tier tag** beside a heading (e.g. `· GA`) sets that one feature's rigor above
  or below the project default; no tag inherits the default. It decides the feature's
  check boxes and each skill's next suggestion.
- **Workflow** (header line) is the project default, what runs after `/feature-build`:
  **Prototype** = nothing (trust `/feature-build`'s own build time self check);
  **Alpha** = `/verify-release`; **Beta** = `/verify-release` then `/test-engineer`;
  **GA** adds a fresh model `/peer-review` then `/tech-writer`. A feature built on an
  unratified decision (an `Assumed` spec) stays flagged, but that never blocks `done`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by
  `/solution-architect`, the code path by `/feature-build`.

## References

**Project sources**

- The React reference app at `~/Projects/veni-react`: the spec for every behaviour this
  port reproduces.
- Root `AGENTS.md`: the parity rule, the branding and theme exceptions, and the porting
  gotchas recorded from reading both codebases.
- Your answers in this planning session: routing as two routes, the theme provider with a
  header control, free with no accounts for now, solo with no deadline, and nothing extra
  in this first slice.

**Practices and standards**

- Foundations before features: the theme, the theme provider and the route shape come
  first, because every later slice renders against them.
- Vertical slices ship real value early: each flow step is built thin and working, and
  verified against the reference before the next one starts.
- The riskiest dependency goes first: template upload carries `pdfjs-dist`, so its client
  boundary and worker wiring surface while there is little else to unpick.