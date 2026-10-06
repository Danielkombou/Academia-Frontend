# 0002. Add a dark mode provider and a header toggle

**Date**: 2026-10-05
**Status**: In Progress

## Summary

Veni has both a light and a dark palette in `app/globals.css`, but nothing turns the dark one on.
Today the only way in is typing `dark` onto the html element by hand. This spec adds a provider
that reads a saved colour choice, works out whether that means light or dark, and puts the class
on the html element before the browser paints, so there is no white flash. It adds a header
control that offers three choices, light, dark and follow the system. The provider is the
`next-themes` package, configured once in a small wrapper, and the control is a shadcn dropdown
menu built from components already in the tree. Nothing in `app/globals.css` changes.

## Requirements

**User stories**:
- As a person using Veni, I want the app to come up in the colour my operating system asks for, so
  that it matches the rest of my screen without me doing anything.
- As a person using Veni, I want to override that from the header, so that I can read the app in
  whichever colour suits me at the time.
- As a person using Veni, I want my choice remembered, so that I do not set it again on every
  visit.
- As a person using Veni, I want no white flash on load, so that the page never looks broken for a
  moment before it settles.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: The served HTML carries the provider's synchronous inline script ahead of the page's own
  content, and that script sets the `dark` class on the html element, so the first painted frame is
  already the right palette and a visitor whose choice resolves to dark never sees a light frame.
  Checkable two ways: the script appears in the page source before the page content, and a load on
  a machine set to dark shows no light frame.
- **AC-2**: The saved choice is exactly one of `light`, `dark` or `system`, held under the storage
  key `veni-theme`. With nothing saved, the app follows the operating system.
- **AC-3**: The control is a dropdown menu opened from an icon button, holding three items whose
  text is `Light`, `Dark` and `Follow the system`. The base sera menu item style renders them
  uppercase, and that is left as it is.
- **AC-4**: Choosing an item applies that choice at once and saves it under `veni-theme`, so the
  next visit opens in it.
- **AC-5**: The active choice is marked in the menu by a real radio group. The base UI primitive
  behind `DropdownMenuRadioItem` sets `role="menuitemradio"` and `aria-checked`, so a screen reader
  announces which item is selected, and a dot inside the active item is the visual mark. The dot is
  the only visual mark, since the base sera item style carries no checked state tint of its own.
- **AC-6**: While the choice is Follow the system, a change to the operating system repaints the
  open page with no reload.
- **AC-7**: A choice made in one tab shows up in the other open tabs, and choosing Follow the system
  in one tab puts the others back on Follow the system.
- **AC-8**: When local storage is unavailable or throws, the app follows the operating system, keeps
  working for the session, and shows no error.
- **AC-9**: The html element carries `suppressHydrationWarning`, because the script changes its
  class before React takes over and React would otherwise report a mismatch it cannot fix.
- **AC-10**: The browser is told which colour scheme is active, so the things it draws itself,
  scrollbars, date pickers and form controls, match the page.
- **AC-11**: Transitions are suppressed only while the class is being changed, so no transition runs
  during a switch. Checkable by switching theme on an element that has a real transition, such as
  the menu opening or a hover rule, and watching it snap rather than animate.
- **AC-12**: The control renders a placeholder on the server and on the first client render: the
  same ghost icon sized Button as the trigger, carrying the same size and the icon's box reserved
  by a hidden icon, so nothing renders from a value the server could not have known, and the
  header holds its width when the real control replaces it.
- **AC-13**: With scripting turned off, the page renders in light mode. No CSS fallback keyed on
  the operating system preference is added.
- **AC-14**: The provider wraps the body content in `app/layout.tsx`, so every route added later
  inherits dark mode without anyone having to remember to add it.
- **AC-15**: The trigger shows the theme actually applied, so Sun for light, Moon for dark and
  Monitor while following the system, and it carries the accessible name `Theme` on both the button
  and its tooltip. The `TooltipProvider` that base UI requires is rendered inside `ThemeToggle`, so
  placing the control in a header is all feature 3 has to do.
- **AC-16**: `pnpm build` passes, `pnpm lint` reports nothing beyond the recorded baseline of 125
  errors, all of them pre existing in `components/ui/`, and `pnpm test` passes all 81 existing
  tests plus the ones this feature adds.

## Decision

**Chosen option**: Option 1: `next-themes`, configured in a thin wrapper.

Add `next-themes` as a dependency and put a single client component at
`components/providers/theme-provider.tsx` that renders the package's `ThemeProvider` with
`attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange` and
`storageKey="veni-theme"`, leaving `enableColorScheme` at its default of on. Wrap the body content
in it from `app/layout.tsx` and add `suppressHydrationWarning` to the html element. Build the
control at `components/theme-toggle.tsx` as a `DropdownMenu` from `@/components/ui/dropdown-menu`
holding a `DropdownMenuRadioGroup` with three `DropdownMenuRadioItem` entries, gated behind a
mounted check that renders a same size placeholder until it passes.

**Implementation skills**: `tailwindcss` (`anthropics/skills`, `~/.agents/skills/tailwindcss/`)

## Rationale

Reasoning and options: see rationale.md

## Feature design

**Data model sketch**: no database, no server, no account. The persisted record is one key in the
visitor's own browser.

| Record | Field | Type | Nullable | Source |
|---|---|---|---|---|
| Saved colour choice | `veni-theme` in `localStorage` | one of `light`, `dark`, `system` | yes, absent on a first visit | written by `setTheme` from the control, read by the provider's script |

Nothing derived is stored. The theme actually applied is worked out from the saved choice and the
operating system preference on every read, so the two can never disagree.

**State transitions**: the applied theme is a function of two inputs, not a machine with events.

```
saved choice   system preference   applied theme   html element
system         light              light           no dark class
system         dark               dark            dark class
light          either             light           no dark class
dark           either             dark            dark class
absent         either             as system       as above
```

Choosing an item moves the saved choice and repaints. An operating system change while the saved
choice is `system` repaints the same page. A storage event from another tab rewrites the saved
choice in this tab. Transitions are suppressed across each repaint only.

**API surface**: this feature adds two modules and no endpoint. `components/providers/theme-provider.tsx`
takes children and nothing else, because every setting is fixed in the wrapper and a caller that
could pass a different storage key or attribute is a caller that can break the class contract.

| Export | Signature | Notes |
|---|---|---|
| `ThemeProvider` | `({ children }: { children: React.ReactNode }) => React.JSX.Element` | Client component. All five settings fixed in the wrapper. No overrides accepted. |
| `ThemeToggle` | `() => React.JSX.Element` | Client component, no props. Reads the current choice from `useTheme()`. Placement is feature 3's job. |

The values come from the package's own `useTheme` hook, which returns `theme` (the saved choice),
`resolvedTheme` (the theme actually applied), `systemTheme` and `setTheme`. Nothing is reimplemented.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Applying the theme on load | The class on the html element | The saved choice at key `veni-theme`, or the `prefers-color-scheme` media query when the choice is `system` or absent |
| Rendering the server markup and the first client render | The placeholder instead of the control | `theme` and `resolvedTheme` are both `undefined` on the server and on the first client render, because the saved choice is only read in the browser. The mounted gate exists for that reason, so this is the load bearing reason and not tidiness |
| Rendering the trigger icon | Which of Sun, Moon or Monitor to draw | `resolvedTheme` from `useTheme()`, with `theme` used to pick Monitor while the choice is `system` |
| Marking the active menu item | Which radio item is checked | `theme` from `useTheme()`, the saved choice |
| Choosing a menu item | The new saved choice and the repaint | The `setTheme` call with `light`, `dark` or `system`, written back to `veni-theme` |
| The browser colour scheme | The value of `color-scheme` on the html element | `resolvedTheme`, applied by `enableColorScheme` |
| Following a live operating system change | The repaint | The `prefers-color-scheme` media query listener inside the provider |
| Another tab following along | The rewritten saved choice | The `storage` event, filtered on the key `veni-theme` |
| The accessible name of the trigger | The string `Theme` | Fixed in `components/theme-toggle.tsx` on both the button and the tooltip |
| `window.matchMedia` under test | A media query object with `matches`, `addListener` and `removeListener` | Stubbed in `vitest.setup.ts`, because jsdom implements none of it |

Every value an acceptance criterion needs is named here. None is left for the build to invent.

**Key invariants**:
- The `dark` variant keys off the `dark` class, so `attribute="class"` is load bearing. The
  package's own default is `data-theme`, which would compile to nothing here and leave every
  `dark:` utility dead.
- The storage key is `veni-theme` in every place it appears. The provider prop and the storage
  listener key are the same string.
- No route reads storage on the server, so every page stays statically rendered and this feature
  adds no dynamic rendering.
- The class on the html element is written by the provider's script, never by React rendering, so
  `suppressHydrationWarning` stays on that element permanently. Nobody adds `dark` to the class
  list at `app/layout.tsx:33`: that single edit would put React in charge of a class the script
  also owns, and the mismatch would be suppressed rather than reported.
- The control reads the current choice from context only after it has mounted, and its placeholder
  is the same ghost icon sized Button as the trigger with the icon's box reserved by a hidden icon,
  so the reserved width is the real trigger's width rather than a guess.
- Base UI's `DropdownMenuTrigger` takes a `render` prop rather than the Radix `asChild`, so the
  tooltip trigger and the dropdown trigger are composed by passing the same `Button` element to both
  `render` props and letting base UI merge the refs.
- `vitest.setup.ts` stubs `window.matchMedia`. jsdom implements none of it, so `app/layout.test.tsx`,
  which renders `RootLayout` directly, throws the moment the provider is wrapped around the body.
- No file in `app/globals.css` changes. Token names, the `.dark` block and the `@custom-variant`
  line are all owned by spec 0001 and stay exactly as they are.
- The provider is mounted once, in the root layout, and never inside a route.

**Security model**: not applicable, no data and no auth. The stored value is one of three words,
it never leaves the visitor's browser, and it identifies nobody. No personal data, no regulated
category and no compliance scope is touched. Worth noting once: the provider's script reads the
stored string and adds it as a class token, so a value containing whitespace would raise a
`DOMException`. That call sits inside the library's try block, so it is swallowed and the page
simply renders light. It is not reachable by a visitor.

**Configuration required**: none. No environment variables, no credentials, no third party
account. `next-themes` is the only addition to `package.json`, at `^0.4.6`.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: on a machine set to dark, `pnpm dev`, the served HTML shows the provider's script
  ahead of the page content, the first painted frame is dark with no white flash, the trigger shows
  Moon, picking Light repaints and marks Light in the menu, and a reload stays light.
  Verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-15**
- First visit with nothing saved: with the machine set to dark, the page follows it, and with the
  machine set to light, the page follows that. Verifies **AC-2**, **AC-6**
- Failure case: storage blocked, the theme still flips within the session, nothing is remembered,
  and no error reaches the visitor. Verifies **AC-8**
- Live operating system change: set the choice to Follow the system, change the machine from light
  to dark, and the open page repaints with no reload. Verifies **AC-6**
- Second tab: set Dark in one tab, and the other tab, already open, repaints; then set Follow the
  system in the first and the second returns to following the machine. Verifies **AC-7**
- No control before mount: the server rendered HTML contains the placeholder and not the control,
  the placeholder measures the same width as the real trigger, and the header holds its width across
  the swap. Verifies **AC-12**
- No transitions during a switch: switch theme while an element with a real transition is on screen
  and it snaps rather than animating. Verifies **AC-11**
- Scripting off: with JavaScript disabled the page renders light and every `dark:` utility stays
  dormant. Verifies **AC-13**
- Regression guard: `pnpm build` passes, `pnpm lint` stays at or below the 125 error baseline with
  nothing in the four files this feature touches, and `pnpm test` passes the 81 existing tests plus
  the new ones. Verifies **AC-16**

## Build plan

The project builds by Tracer Bullet, a thin slice proved end to end before the next one thickens
it. For a feature this size that means standing the whole path up in its barest form first, one
button calling one function, and proving the flash free load and the saved choice before any
polish exists. If any of it fails, it fails on four lines rather than on a finished dropdown.

- [x] 1. Add `next-themes` at `^0.4.6` to `dependencies` and create
      `components/providers/theme-provider.tsx` as a client component rendering the package's
      `ThemeProvider` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`,
      `disableTransitionOnChange` and `storageKey="veni-theme"`, leaving `enableColorScheme` on
      its default, and taking children only with no overrides, satisfies **AC-1**, **AC-2**,
      **AC-6**, **AC-7**, **AC-8**, **AC-10**, **AC-11**
- [x] 2. Add a `window.matchMedia` stub to `vitest.setup.ts` returning an object with `matches`
      `false`, `addListener` and `removeListener`, and confirm `app/layout.test.tsx` still passes
      before touching the layout, satisfies **AC-16**
- [x] 3. Wrap the body content in the provider in `app/layout.tsx` and add
      `suppressHydrationWarning` to the html element, keeping the `LayoutProps<"/">` signature,
      the three font variables, `h-full`, `antialiased`, `font-sans` and the selection colours
      exactly as they are, and adding no `dark` to that class list, satisfies **AC-9**, **AC-14**
- [x] 4. Prove the thin slice before thickening anything. Create a throwaway `/theme` route
      rendering a bare `Button` that calls `setTheme`, run the app on a machine set to dark, view
      the page source to confirm the provider's script sits ahead of the page content, and confirm
      the first painted frame is already dark, the class is on the html element, and the choice
      survives a reload, satisfies **AC-1**, **AC-2**, **AC-4**
- [x] 5. Replace the bare button with `components/theme-toggle.tsx`: a `DropdownMenu` triggered by
      a ghost icon sized `Button` holding a `DropdownMenuRadioGroup` of three
      `DropdownMenuRadioItem` entries for Light, Dark and Follow the system, each calling
      `setTheme`, with the whole control gated behind a mounted check that renders the same ghost
      icon sized Button as a placeholder with a hidden icon reserving the box until it passes,
      satisfies **AC-3**, **AC-4**, **AC-5**, **AC-12**
- [x] 6. Add the trigger icon showing the theme applied, Sun for light, Moon for dark and Monitor
      while following the system, using `theme` to pick Monitor and `resolvedTheme` for the other
      two, wrap the trigger in a `TooltipProvider` from `@/components/ui/tooltip` carrying the
      content `Theme`, compose the tooltip trigger and the dropdown trigger by passing the same
      `Button` element to both `render` props, and set the accessible name `Theme` on the button,
      satisfies **AC-15**
- [x] 7. Replace the `CheckIcon` inside `RadioItemIndicator` in `components/ui/dropdown-menu.tsx`
      with a dot sized `block size-1.5 rounded-full bg-current`, leaving the checkbox item at line
      172 alone. The dot needs `block`: on a bare inline `span`, Tailwind's width and height are
      ignored and it renders at zero by zero, which is invisible and typechecks cleanly. Satisfies
      **AC-5**
- [x] 8. Prove the whole feature on the throwaway route, which by now renders the real
      `ThemeToggle` in a row standing in for the future header, then delete the route: a live
      operating system change while set to Follow the system, a second tab in the same browser
      context picking the change up, a reload keeping the choice, blocked storage, the placeholder
      measuring the same width as the real trigger with the row holding steady across the swap,
      nothing transitioning during a switch, and scripting off. Satisfies **AC-2**, **AC-4**,
      **AC-6**, **AC-7**, **AC-8**, **AC-11**, **AC-12**, **AC-13**
- [x] 9. Run `pnpm build`, `pnpm lint` and `pnpm test`, and confirm nothing beyond the 125 error
      baseline and that no error sits in the four files this feature touches, satisfies **AC-16**

Note for whoever deletes the throwaway route in task 8: spec 0001 records that `.next` holds a
generated validator still naming the deleted route, so delete `.next` before rebuilding or the type
check fails on a module that no longer exists.

## Consequences

**Positive**:
- Dark mode stops being unreachable. Half the theme ships to everyone on the machine that asks for
  it, and the reference app's behaviour, following the operating system, is reproduced.
- The flash is gone, so the app never looks broken for a moment on a dark laptop.
- Around sixty five lines of our own code for the whole feature, and most of it shadcn markup.
- Other open tabs follow the choice, so one browser does not show two palettes at once.
- The browser draws its own controls to match, so scrollbars and date pickers stop clashing.
- The provider sits in the root layout, so no later route can forget it.

**Negative / tradeoffs**:
- A new runtime dependency for what is ultimately one class on one element. If the package is ever
  abandoned, this feature is a rewrite rather than a configuration change.
- The theme logic now lives outside this repo. Its conventions cannot be shaped to the project, and
  the before paint script in particular is code we depend on without being able to read it into a
  test.
- The provider's live operating system listener uses `MediaQueryList.addListener`, deprecated by
  the standards. Every current browser ships it, so live following works, but it is a call we do
  not control.
- `suppressHydrationWarning` on the html element tells React to stop checking that element's
  attributes. That is required here, and it also means a genuine mistake in the html class list
  would go unreported.
- The control is a client component, so whatever holds it becomes a client component too. Feature 3
  builds the Header, and the Header will be client side because of this control. That is not a
  problem for Veni, whose pages are client heavy by nature, but it is a constraint on that feature.
- `components/ui/dropdown-menu.tsx` is generated shadcn source and this feature edits it. A
  regeneration from elsewhere in the shadcn ecosystem would revert the dot to a check mark.
- The choice lives in one browser on one origin. It does not follow a visitor to another device or
  another browser, which is exactly what accounts will have to fix later.
- The control ships as an export nothing imports, because the only thing that renders it until
  feature 3 is the throwaway route this feature deletes. `ThemeToggle` is deliberately not added to
  any barrel file, so there is nothing to keep in step.
- The trigger icon appears a beat after the page paints, because the mounted gate renders the
  placeholder rather than the control on the server. Reserving the icon's box hides the layout
  shift but not the arrival, and the alternative, swapping the icons with CSS, would have cost the
  Monitor state.
- `vitest.setup.ts` now carries a media query stub, which every future test touching the theme or
  anything that reads the system preference depends on.
- In development only, React 19 logs an error on every page load: a script tag was encountered
  while rendering a React component. It comes from `next-themes` rendering its own script, and the
  script has already run by then because the server sent it. The production console is clean, so
  it is developer noise rather than a user facing fault.

**Neutral**:
- With scripting off the app is light only, so dark mode is unavailable to the small number of
  visitors who block JavaScript. No CSS fallback was added, so the dark token values still live in
  one place.
- The trigger icon shows what is applied, not what choosing it would do, so it is a readout rather
  than a hint about the next click.
- No file in `app/globals.css` changes, and no token value moves.
- Three menu items in a dropdown is one more click than a single cycling button would be, in
  exchange for the current choice being visible and reachable in both directions.
- The trigger is a 40 by 40 icon button, which is this design system's standard icon button size
  rather than the 44 by 44 a touch target ideally wants. It is inherited from the Button component
  on purpose, so every icon button in the app matches.

## Follow-up

- [ ] The control is built with no home until feature 3 places it in the real Header. Record that
      constraint in the scope row for Route shape and app shell, so that feature does not rebuild,
      relocate, or add a barrel for it. `ThemeToggle` ships as an unused export in the meantime.
- [ ] When accounts arrive, move the choice out of local storage into user settings and decide what
      happens to the `veni-theme` key. Left as is, a returning signed in visitor sees the stale
      local choice until they pick again.
- [ ] `components/ui/dropdown-menu.tsx` is now hand edited generated source. Note that in root
      `AGENTS.md` at the next state sync, so nobody regenerates it and silently reverts the dot.
- [ ] The `tailwindcss` skill installed at the user level governs the class based dark variant this
      decision depends on, and root `AGENTS.md` still has no `## Agent skills` section pointing at
      it. Spec 0001 carries the same open item; it applies here too.
- [ ] AC-16 records the lint baseline as 125 errors. Running the project's own `pnpm format` during
      this build reformatted the generated shadcn components, which had been written without
      semicolons, and the figure is now 62, all of them still in `components/ui/`. AC-16 holds,
      since nothing exceeds 125 and nothing sits in the files this feature owns, but the recorded
      number is stale. Spec 0001 records the same 125 and should be reconciled at the next state
      sync.