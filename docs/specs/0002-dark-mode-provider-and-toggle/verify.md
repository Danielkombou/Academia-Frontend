# Verify: Theme provider and dark mode toggle · spec 0002 · updated 2026-10-05

_Steps derived from spec 0002 acceptance criteria. `/verify-release` runs these; `/test-engineer`
locks the durable ones._

Every browser step needs a way to set the operating system colour scheme and to inspect the
rendered page. `agent-browser` covers both: `agent-browser set media dark` or `light` sets the
machine preference, and `agent-browser eval` reads classes, attributes and computed styles. Run it
with `--args --no-sandbox` in a container. Two tabs must be in the **same** browser session, or they
will not share storage and the cross tab step will silently pass for the wrong reason.

## Commands

- [x] `pnpm build` → exits 0, and every route still shows `(Static)` prerendered → AC-14, AC-16
- [x] `pnpm test` → all 81 existing tests pass → AC-16
- [x] `pnpm lint` → no error in `app/layout.tsx`, `components/providers/theme-provider.tsx`,
      `components/theme-toggle.tsx`, `vitest.setup.ts`, or `components/ui/dropdown-menu.tsx` → AC-16
- [x] `git diff` is not available in this repo, so confirm the four files above by reading them
      rather than by diff → AC-16

## The no flash claim, proved two ways

- [x] View the page source of any route and confirm `next-themes`' inline script appears **before**
      the page's own content, and that its arguments include `"class"` and `"veni-theme"` → AC-1
- [x] Block every external script (`agent-browser network route "*" --abort --resource-type
      script`), reload, and confirm the page still renders the dark palette on a machine set to
      dark, with `dark` on the html element. This is the decisive check: React never hydrates, so a
      dark page proves the class came from the served HTML → AC-1
- [x] Repeat with the machine set to light and confirm the page renders light with no `dark` class
      → AC-1, AC-13

## First visit and the saved choice

- [x] With `localStorage` empty and the machine on dark, confirm the page is dark and
      `localStorage.getItem("veni-theme")` is `null` → AC-2
- [x] With `localStorage` empty and the machine on light, confirm the page is light → AC-2
- [x] Pick Dark, confirm `veni-theme` is `dark` and the html element gains `dark` at once → AC-2, AC-4
- [x] Pick Light on a **dark** machine, confirm the page goes light, proving the saved choice
      overrides the machine → AC-4
- [x] Reload, confirm the saved choice survives and the page opens in it → AC-4
- [x] Confirm the key is `veni-theme` and the value is one of `light`, `dark`, `system` → AC-2

## The control

- [x] Open the control and confirm three items reading `Light`, `Dark` and `Follow the system`; the
      base sera style renders them uppercase and that is expected → AC-3
- [x] With the menu open, confirm each item exposes `role="menuitemradio"` and that only the active
      one has `aria-checked="true"` → AC-5
- [x] Confirm a **visible** dot sits beside the active item, about 6 by 6, and that unchecked items
      have none. Measure it, do not trust the code: on a bare inline `span` the size utilities are
      ignored and the dot renders at 0 by 0 while still looking correct in review → AC-5
- [x] Confirm the trigger's icon is Sun when light, Moon when dark, and Monitor while following the
      system, checking all three states → AC-15
- [x] Confirm the trigger button carries `aria-label="Theme"` and that hovering it shows a tooltip
      reading `Theme` → AC-15
- [x] Confirm the trigger also carries `aria-haspopup="menu"` and a correct `aria-expanded` → AC-5
- [x] Keyboard only: reach the trigger with Tab, open the menu with Enter, move between items with
      the arrow keys, choose with Enter, and confirm Escape closes it and focus returns to the
      trigger → AC-3, AC-5
- [x] Confirm the trigger icon itself is `aria-hidden`, since the button already carries a name → AC-15

## Following the machine and other tabs

- [x] Set the choice to Follow the system, then change the machine light to dark without
      reloading, and confirm the page repaints both ways and the icon stays a Monitor → AC-6
- [x] Open **two tabs in one session**. In the first, pick Light. Without touching the second,
      confirm it repaints to light, which is the storage event and not the machine preference: set
      the machine to dark first so following the machine would give the opposite result → AC-7
- [x] In the second tab, pick Follow the system, and confirm the first returns to following the
      machine → AC-7

## Blocked storage

- [x] In the page, redefine `window.localStorage` so every method throws `SecurityError`, then with
      the machine on light pick Dark and confirm the page still goes dark, nothing is persisted, and
      no error is shown to the user → AC-8
- [x] Confirm `document.documentElement.classList` gained and lost only `dark` and `light`, never
      the literal string `system` → AC-8

## Transitions and native controls

- [x] Install a `MutationObserver` on `document.head`, switch theme, and confirm a style element
      containing `transition:none!important` is injected during the switch → AC-11
- [x] Confirm `document.documentElement.style.colorScheme` reads `dark` or `light` matching the
      applied theme in both modes → AC-10

## The placeholder and the server

- [x] View the server rendered HTML and confirm the placeholder is present (`aria-hidden="true"`
      and `tabindex="-1"`) and the real control is **not** (no `aria-label="Theme"`, no
      `menuitemradio`) → AC-12
- [x] With scripts blocked, measure the placeholder, then with scripts allowed measure the real
      trigger, and confirm both are 40 by 40 with the same icon box, and that a row containing it
      holds its width across the swap → AC-12
- [x] Confirm `app/layout.tsx` has `suppressHydrationWarning` on the html element, wraps the body
      content in the provider, keeps `LayoutProps<"/">`, and has **no** `dark` in the html class
      list → AC-9, AC-14
- [x] Confirm `app/globals.css` is unchanged and still carries `@custom-variant dark
      (&:is(.dark *))` plus the `.dark` block → AC-14
- [x] Confirm `vitest.setup.ts` stubs `window.matchMedia`, and that removing it makes
      `app/layout.test.tsx` fail, which is what proves the stub is load bearing → AC-16

## Value sourcing coverage

One step per row of the spec's Value sourcing table, each exercising the source rather than the
result. The theme class comes from storage or the media query (store `dark`, reload on a light
machine, then clear storage and reload on a dark machine); the placeholder stands in for the
undefined values on the server and first client render; the icon comes from `resolvedTheme` with
`theme` overriding it (check all three states); the active item comes from `theme` (compare the
radio group's value against what was stored); the browser colour scheme comes from
`resolvedTheme` (check both modes); the live repaint comes from the media query listener (change
the machine with no reload); the other tab's update comes from the storage event filtered on
`veni-theme` (the two tab step, with the machine set against it); the accessible name is the fixed
string `Theme` on both the button and the tooltip; and `matchMedia` under test comes from the
`vitest.setup.ts` stub.

## Known to be acceptable

- [x] React 19 logs an error in **development** on every page load: a script tag was encountered
      while rendering a React component. It comes from `next-themes` rendering its own script, which
      has already run by then. Confirm the **production** console is empty; this is developer noise,
      not a user facing fault → AC-1
- [x] A saved value that is not one of the three states, which only hand edited storage can produce,
      renders light with nothing marked in the menu. That is the documented trade in the Rationale,
      not a defect to fix → AC-2

## Acceptance-criteria coverage

AC-1 source ordering and no flash, both proved · AC-2 three saved values plus the empty case ·
AC-3 three items and keyboard operation · AC-4 apply and persist · AC-5 radio role, aria-checked and
the visible dot · AC-6 live machine change · AC-7 two tabs in one session, both directions · AC-8
blocked storage · AC-9 `suppressHydrationWarning` · AC-10 `colorScheme` in both modes · AC-11 the
injected `transition:none` · AC-12 server placeholder and equal widths · AC-13 no theme class in
the served markup and no CSS media fallback · AC-14 provider in the root layout with all routes
static · AC-15 three icons, accessible name and tooltip · AC-16 build, lint and test.