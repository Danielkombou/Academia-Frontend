# Verify: Veni theme and typography · spec 0001 · updated 2026-10-05

_Steps derived from spec 0001 acceptance criteria. `/verify-release` runs these; `/test-engineer` locks the durable ones._

## UI / manual

- [x] `pnpm dev`, put `className="dark"` on the html element → surfaces repaint, primary green unchanged → AC-8
- [x] Inspect `--primary` in both modes → `oklch(0.683 0.112 161.7)`, and `--ring` the same value → AC-1
- [x] Check a primary Button's text against its own background → dark ink, not white, 6.31 to 1 → AC-5 _(measured 6.36 to 1 in both modes. On 2026-10-05 this was also measured on a rendered Button, whose background read #4faf83 and whose label read #161d1b, the dark ink, so the figure is no longer token level only)_
- [x] Inspect one `bg-primary/80` and one `bg-destructive/10` element → computed colour is translucent, not opaque → AC-6
- [x] Render all six Button variants → each paints, including `secondary` with its oklch `color-mix` → AC-7 _(confirmed 2026-10-05 on the throwaway route: all six paint with their own colours, all eight sizes have real dimensions, and the secondary hover resolves to `oklch(0.933598 0.00441406 none)`, so its `color-mix(in oklch, ...)` rule works. The route is now deleted, see run record)_
- [x] Check `rounded-sm` through `rounded-4xl` → seven distinct steps, `rounded-lg` equals `0.725rem` → AC-3 _(all seven rendered at 6.96, 9.28, 11.6, 16.24, 20.88, 25.52 and 30.16px while the throwaway route used those class names, and `rounded-lg` at 11.6px is 0.725rem. The route is now deleted, so three of the seven fall out of the emitted css again)_
- [x] Render `font-sans`, `font-serif`, `font-mono`, `font-heading` → Outfit, Nunito, JetBrains Mono, Outfit → AC-4
- [x] Read `--destructive` in dark mode → the lightened red, 5.11 to 1 on the dark background → AC-9 _(measured 5.13 to 1)_
- [x] Read `--chart-1` through `--chart-5` and the eight `--sidebar-*` tokens → all defined, sidebar resolves to the current mode's surfaces → AC-2
- [x] Read `components.json` → `baseColor` is `neutral`, not `taupe` → AC-11
- [x] Read the base layer → no universal letter spacing rule, `--tracking-normal` untouched, selection uses the primary, no heading size rule → AC-12
- [x] Count a text value: the light green, a surface, a subtle grey, and the red, against the log's triplets → each matches its annotated conversion → AC-1, AC-2 _(17 light and 14 dark tokens compared numerically)_

## Commands

- [x] `pnpm build` → passes → AC-10
- [x] `pnpm lint` → 125 errors, all pre-existing in the generated components, nothing new → AC-10

## Value sourcing

- [x] Light and dark colour values: compare a sample against the hsl triplets annotated in the spec's Feature design table
- [x] `--primary-foreground`: confirm dark ink in both modes _(6.36 to 1 in both; the white figure was not re-measured at runtime)_
- [x] Dark `--destructive`: confirm it is the lightened value, not the log's dark one at 1.93 to 1
- [x] Dark `--border` and `--input`: confirm the alpha form survives _(both confirmed: `oklch(1 0 0 / 10%)` and `/ 15%`. The hover lift claim needs a rendered Button and was not tested)_
- [x] Chart values: confirm they are present and treated as a starting point, not a decision
- [x] Sidebar set: confirm each token resolves to the same mode's surface or brand token
- [x] Radius scale: confirm the scaffold multipliers survived on top of the new radius _(the math checks out; see run record)_
- [x] Font stacks: confirm each has a generic fallback after the loaded family
- [x] `--font-heading`: confirm it resolves to Outfit _(the seven components using it were not rendered)_

## Acceptance criteria coverage

- AC-1 covered by the `--primary` inspection step and the conversion spot check
- AC-2 covered by the chart and sidebar read step and the conversion spot check
- AC-3 covered by the radius scale step
- AC-4 covered by the four font utility renders
- AC-5 covered by the primary Button contrast step
- AC-6 covered by the opacity modifier inspection step
- AC-7 covered by the six Button variant renders
- AC-8 covered by the dark class step
- AC-9 covered by the dark destructive read step
- AC-10 covered by `pnpm build` and `pnpm lint`
- AC-11 covered by the `components.json` read step
- AC-12 covered by the base layer read step

## Notes for the verifier

- Nothing in the repo renders a Button by default, and `app/page.tsx` hardcodes `bg-zinc-50`,
  `bg-white`, `bg-black` and `text-black`, so the landing page cannot prove the theme. Recreate a
  throwaway route to check the Button, then delete it. That route is not part of the build. The one
  used on 2026-10-04 and 2026-10-05 was `app/theme-probe/page.tsx`; it has now been deleted, so
  recreate it if you need it again.
- Dark mode has no provider yet (scope feature 2). Adding `dark` to the html className by hand is the
  whole mechanism, and it is temporary.
- `pnpm lint` was already failing before this feature, at 127 errors across the generated shadcn
  components. The build left it at 125, and it is still 125 now that the throwaway route is gone.
- Read a colour out of the DOM by painting it, not by string comparison. See trap 1 below.
- Check `pnpm build` after deleting a route, and delete `.next` first if it fails on a module that no
  longer exists. The generated validator under `.next/dev/types/` still names the old route.

## Run record: 2026-10-04, /verify-release

Driven with `pnpm dev` on http://localhost:3000/, probed with `agent-browser` (Chrome, `--no-sandbox`).
Screenshots: `/tmp/opencode/f5-light.png` and `/tmp/opencode/f5-dark.png`. Verdict: 11 of 12 criteria
met, AC-7 blocked. Measured values are below; two differ slightly from the spec's stated figures and
both still pass.

**Superseded on 2026-10-05** where it disagrees with the later record below. That pass had a route
rendering the components, so trap 3 and the AC-7 block no longer hold. The traps themselves all still
hold and are worth reading.

| Criterion | Measured | Spec said |
|---|---|---|
| AC-5 primary-foreground on primary | 6.36 to 1, both modes | 6.31 |
| AC-9 dark destructive on dark background | 5.13 to 1 | 5.11 |
| muted-foreground on background | 4.58 light, 8.10 dark | 4.56 |

**Method traps that will bite the next verifier.** Each of these produced a wrong answer first:

1. `getComputedStyle().getPropertyValue("--token")` returns colours serialised as `lab(...)`, not the
   authored `oklch(...)`. Comparing the strings reports every token as a mismatch. Convert instead:
   paint the colour into a canvas and read the pixel, or compare relative luminance.
2. Tailwind only emits a utility when some source file uses it. `bg-primary-foreground`,
   `bg-muted-foreground`, `bg-destructive-foreground` and `text-destructive-foreground` are used by no
   component, so they resolve to nothing and read as inherited or transparent. Measuring contrast
   through those utilities compares the wrong colour. Inject a temporary rule that sets
   `background-color: var(--primary-foreground)` and measure that.
3. The same applies to `rounded-md`, `rounded-2xl` and `rounded-3xl`: no source file uses them, so
   those three rules are absent and the elements render at 0px. `rounded-sm`, `-lg`, `-xl` and `-4xl`
   do render, at 6.96, 11.6, 16.24 and 30.16px, all correct multiples of 0.725rem. Probing
   `calc(var(--radius) * 0.8)` directly gives 9.28px, `* 1.8` gives 20.88px and `* 2.2` gives 25.52px,
   so the scale is correct and the gap is emission only. AC-3's wording ("all exist") overstates what
   Tailwind emits; the substance holds.
4. `--radius-sm` through `--radius-4xl` read as empty on the html element. That is correct: the theme
   block is `@theme inline`, so those properties are inlined into utilities and never emitted.
5. `document.fonts.check("16px Nunito")` returns false until something renders Nunito text. The
   families load lazily, so render text in each family and wait before checking.
6. Next's dev overlay injects its own `__nextjs-Geist` faces in development. They are not app code
   and are absent from the production bundle, which contains Outfit, Nunito and JetBrains Mono and no
   Playfair and no Geist.

**Findings worth carrying forward, not failures:**

- `text-destructive` on the light background is 3.76 to 1, below the 4.5 bar, so the destructive
  Button's label is under AA in light mode. `--destructive-foreground` on `--destructive` is 3.61 to 1
  in both modes. This is inherited from the Tailwind and shadcn default red and no acceptance
  criterion covers it.
- `--chart-5` is 1.37 to 1 against the dark background, so it is nearly invisible as a dark mode chart
  colour. The spec already flags the chart values as a starting point rather than a decision.
- The spec's Context says the extracted triplet works out to #4eaf83. What ships renders as #4faf83.
  The difference is the three decimal rounding of the oklch values, imperceptible, but the spec's
  stated hex is not literally what renders.

## Run record: 2026-10-05, /verify-release

Driven twice with `pnpm dev` on http://localhost:3000/theme-probe, probed with `agent-browser` over
CDP. The second pass used a Chrome launched with a fine pointer so that hover rules would apply at
all, see the new trap below. Screenshots: `/tmp/opencode/v2-light.png` and `/tmp/opencode/v2-dark.png`.
Verdict: all 12 criteria met, none blocked. Every contrast figure and every token value matched the
2026-10-04 pass, so the two passes agree.

| Criterion | Measured here | 2026-10-04 | Spec said |
|---|---|---|---|
| AC-5 ink on the green, both modes | 6.36 to 1 | 6.36 to 1 | 6.31 |
| AC-9 dark destructive on the dark background | 5.13 to 1 | 5.13 to 1 | 5.11 |
| muted-foreground on the background | 4.58 light, 8.10 dark | same | 4.56 |
| chart-5 on the dark background | 1.37 to 1 | 1.37 to 1 | not stated |

**Value check.** 12 light tokens, 7 dark tokens and the 5 chart tokens were converted from the spec's
oklch values to hex independently of the browser, then compared with what the browser painted. Every
one matched with a worst channel drift of 0. The primary lands on #4faf83 in both modes.

**AC-7 closed.** All six Button variants paint with their own colours and all eight sizes have real
dimensions. Hover was measured per variant, one at a time, with a 500ms settle: the default variant
computes to `oklab(... / 0.8)`, the outline and ghost variants to the muted token, the secondary to
`oklch(0.933598 0.00441406 none)` which is its `color-mix(in oklch, ...)` rule resolving, and the
destructive variant to `oklab(... / 0.2)`.

**AC-3 closed.** All seven radius steps rendered, at 6.96, 9.28, 11.6, 16.24, 20.88, 25.52 and
30.16px, all correct multiples of 0.725rem, and `rounded-lg` at 11.6px is 0.725rem exactly. This only
worked because the throwaway route used all seven class names. See trap 3 above, and the note below on
the route now being deleted.

**New trap, and it is the one that costs you the most time.** Headless Chrome reports
`matchMedia("(hover: hover)")` as false, so Tailwind wraps every `hover:` rule in a media query that
never matches. Hover states then read as their rest state and AC-6 and AC-7 look like they pass while
proving nothing. Launch Chrome yourself and connect over CDP with the pointer forced:

```
chrome --headless=new --no-sandbox --remote-debugging-port=9334 \
  "--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4"
agent-browser --session <name> --cdp 9334 open http://localhost:3000/theme-probe
```

**Second trap, about reading state.** Adding the `dark` class and reading computed styles in the same
script returns stale colours for elements whose colour is inherited, so the outline, ghost and
secondary Buttons looked like they had kept the light mode ink. Add the class in one call, read in the
next. The token swatches were never affected, which is what made the stale reading look real.

**Third trap, about transitions.** The Button carries `transition-all`, so a computed background read
straight after hovering is an intermediate value. A default variant hover came back as
`oklab(... / 0.993428)` rather than `/ 0.8`. Hover, wait about half a second, then read.

**Cleanup done in this pass.** The throwaway route `app/theme-probe/page.tsx` is deleted, as build plan
task 4 asks, so `pnpm build` now ships only `/` and `/_not-found`. `pnpm lint` is back to 125 errors,
the same count the build left, with nothing new in any file this feature owns, and `pnpm test` passes
81. The landing page was re-checked afterwards: it renders, the body background resolves to the
background token, the primary renders #4faf83, and only the three Veni families load.

**A note on removing a route.** `pnpm build` failed after the deletion with `Cannot find module
'../../../app/theme-probe/page.js'` from `.next/dev/types/validator.ts`, a generated file that still
names the deleted route. Deleting `.next` fixed it. Nothing is wrong with the code.

**Findings worth carrying forward, not failures.** Unchanged from 2026-10-04 and re-measured here:
`text-destructive` on the light background is 3.76 to 1, and the destructive Button's own label is
fine at 5.2 to 1 because that variant paints a 10 percent tint rather than a solid fill.
`--destructive-foreground` on `--destructive` is 3.61 to 1 in both modes. `--chart-5` is 1.37 to 1 on
the dark background. `app/page.tsx` still hardcodes zinc, black and white, which is feature 3's job.
