# 0001. Apply the Veni theme and typography

**Date**: 2026-10-04
**Status**: Accepted

## Summary

The app still renders the stock taupe shadcn palette and four scaffold fonts. This spec applies the
Veni green theme and the Outfit, Nunito and JetBrains Mono fonts, converted from the theme log the
engineer extracted from the light and dark previews, and wired through the existing Tailwind theme
block. Every shadcn component keeps resolving its tokens, including the opacity modifiers on the
primary colour that the base sera Button depends on.


## Requirements

**User stories**:
- As a person using Veni, I want the app to look like Veni so that it feels like one product rather
  than a scaffold.
- As a person building Veni, I want every shadcn component to resolve its tokens so that adding a
  component never produces an unstyled one.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: The primary renders as `oklch(0.683 0.112 161.7)`, converted from the log's
  `hsl(153 38% 49.6%)`, in both light and dark mode, and the ring token is that same green.
- **AC-2**: Every other colour token renders its converted Veni value in light and dark: background,
  foreground, card, popover and their foregrounds, secondary, muted, accent, border, input and
  destructive. The chart one through five tokens and the full sidebar set are both defined. Their
  values are a starting point rather than a contract, since nothing in the repo renders them yet.
- **AC-3**: The radius is `0.725rem`, and the radius scale keeps the scaffold's multipliers, so
  `rounded-sm` through `rounded-4xl` all exist and `rounded-lg` equals the radius.
- **AC-4**: Sans renders in Outfit, serif in Nunito and mono in JetBrains Mono, each loaded through
  `next/font/google`, exposed on the html element as `--font-outfit`, `--font-nunito` and
  `--font-jetbrains-mono`, and bound to the Tailwind `font-sans`, `font-serif` and `font-mono`
  utilities with generic fallbacks. The `font-heading` utility keeps working, because seven components
  in `components/ui/` use it, and it resolves to Outfit like `font-sans` does. Playfair Display is
  gone.
- **AC-5**: Text on the primary is the dark ink token, and reaches at least 4.5 to 1 contrast against
  the green in both modes. The measured value is 6.31 to 1.
- **AC-6**: Opacity modifiers work on the colour utilities. `bg-primary/80`, `ring-ring/30` and
  `bg-destructive/10` each render a translucent colour, not an opaque one.
- **AC-7**: Every base sera Button variant and size renders correctly, including the `secondary`
  variant's `color-mix(in oklch, ...)` rule.
- **AC-8**: A `className="dark"` on the html element applies the dark palette, with the primary green
  unchanged from light mode. Setting the class by hand is the whole mechanism here, because the theme
  provider is a separate feature.
- **AC-9**: The destructive colour in dark mode reaches at least 4.5 to 1 against the dark
  background, so destructive text is readable. The measured value for the chosen red is 5.11 to 1.
- **AC-10**: `pnpm build` passes and `pnpm lint` reports nothing new.
- **AC-11**: `components.json` no longer says taupe. The `app/globals.css` diff is reviewed after
  every later `npx shadcn add`, since changing the base color changes which palette clobbers the
  greens rather than preventing it.
- **AC-12**: The base layer keeps the scaffold's border, outline, background and text rules and its
  `html { font-sans }` rule. No universal letter spacing rule is introduced and `--tracking-normal`
  is left at Tailwind's default, since three components use `tracking-normal`. Selection uses the
  primary and its foreground. `font-sans` is not added to the body, because the html element already
  carries it. No heading size or weight rule is added; headings inherit Outfit at Tailwind's default
  scale.


## Decision

**Chosen option**: Option 2: Port to oklch with an inline theme block, keep the scaffold's scale and
add the missing tokens.

Write every colour into `app/globals.css` as oklch, convert the extracted hsl values, bind the tokens
through `@theme inline`, keep the 0.725rem radius on the scaffold's multiplier scale, and load Outfit,
Nunito and JetBrains Mono in place of the four scaffold fonts. The dark destructive red is lightened
from the extracted value so destructive text stays readable.


## Rationale

Reasoning and options: see rationale.md

## Feature design

**Token model** (the entities here are token groups, not database tables):

| Group | Tokens | Notes |
|---|---|---|
| Surfaces | `background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground` | Light is white on green tinted ink. Dark is a 5 percent green tinted black at 8 percent for cards. |
| Brand | `primary`, `primary-foreground`, `ring` | One green in both modes. Foreground is the dark ink, never white. |
| Subtle | `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground` | Green tinted greys, the log's 150 and 160 hue steps. |
| Feedback | `destructive`, `destructive-foreground` | The log's light red in light mode, lightened in dark. The foreground token is added because the log defines it and the scaffold does not. |
| Lines | `border`, `input` | The log's value in light mode. Dark keeps the scaffold's alpha form, `oklch(1 0 0 / 10%)` and `oklch(1 0 0 / 15%)`, so hovers still lift off the background. |
| Charts | `chart-1` through `chart-5` | Chart one is the green, the rest step down the green tinted greys. Same in both modes, as in the scaffold. |
| Sidebar | `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring` | Mirrors the surface and brand tokens in each mode. |
| Shape | `radius` | `0.725rem`. |
| Elevation | none added | The log's `--shadow-custom` is not carried over. No component in `components/ui/` reads it, and the components that do cast shadows use Tailwind's own `shadow-sm` scale. |

**Converted values**, each row annotated with the hsl it came from so the builder can check the
conversion rather than trust it. Light:

```
--background oklch(1 0 0)              from hsl(0 0% 100%)
--foreground oklch(0.223 0.012 172.9)  from hsl(160 15% 10%)
--card oklch(1 0 0)                    from hsl(0 0% 100%)
--card-foreground oklch(0.223 0.012 172.9)  from hsl(160 15% 10%)
--popover oklch(1 0 0)                 from hsl(0 0% 100%)
--popover-foreground oklch(0.223 0.012 172.9)  from hsl(160 15% 10%)
--primary oklch(0.683 0.112 161.7)     from hsl(153 38% 49.6%)
--primary-foreground oklch(0.223 0.012 172.9)  from hsl(160 15% 10%), not the log's white
--secondary oklch(0.971 0.004 165)     from hsl(150 14% 96%)
--secondary-foreground oklch(0.281 0.017 172.7)  from hsl(160 15% 15%)
--muted oklch(0.971 0.004 165)         from hsl(150 14% 96%)
--muted-foreground oklch(0.563 0.016 164.4)  from hsl(150 5% 45%)
--accent oklch(0.951 0.009 164.9)      from hsl(150 20% 93%)
--accent-foreground oklch(0.223 0.012 172.9)  from hsl(160 15% 10%)
--destructive oklch(0.637 0.208 25.3)  from hsl(0 84.2% 60.2%)
--destructive-foreground oklch(0.985 0 0)  from hsl(0 0% 98%)
--border oklch(0.927 0.006 165)        from hsl(150 10% 90%)
--input oklch(0.927 0.006 165)         from hsl(150 10% 90%)
--ring oklch(0.683 0.112 161.7)        from hsl(153 38% 49.6%)
```

Dark, where only the surfaces, the subtle greys, the lines and the red change:

```
--background oklch(0.162 0.007 173.3)  from hsl(160 15% 5%)
--foreground oklch(0.963 0.003 165.1)  from hsl(150 10% 95%)
--card oklch(0.199 0.010 173)          from hsl(160 15% 8%)
--card-foreground oklch(0.963 0.003 165.1)  from hsl(150 10% 95%)
--popover oklch(0.199 0.010 173)       from hsl(160 15% 8%)
--popover-foreground oklch(0.963 0.003 165.1)  from hsl(150 10% 95%)
--primary oklch(0.683 0.112 161.7)     from hsl(153 38% 49.6%)
--primary-foreground oklch(0.223 0.012 172.9)  from hsl(160 15% 10%)
--secondary oklch(0.266 0.011 173.3)   from hsl(160 10% 14%)
--secondary-foreground oklch(0.963 0.003 165.1)  from hsl(150 10% 95%)
--muted oklch(0.266 0.011 173.3)       from hsl(160 10% 14%)
--muted-foreground oklch(0.730 0.012 164.7)  from hsl(150 5% 65%)
--accent oklch(0.309 0.014 173.2)      from hsl(160 10% 18%)
--accent-foreground oklch(0.963 0.003 165.1)  from hsl(150 10% 95%)
--destructive oklch(0.636 0.208 25.4)  from hsl(0 84% 60%), lightened from the log's hsl(0 62.8% 30.6%)
--destructive-foreground oklch(0.985 0 0)  from hsl(0 0% 98%)
--border oklch(1 0 0 / 10%)            the scaffold's alpha form, kept so hovers still lift
--input oklch(1 0 0 / 15%)             the scaffold's alpha form, kept so dark:hover:bg-input/30 lifts
--ring oklch(0.683 0.112 161.7)        from hsl(153 38% 49.6%)
```

**Chart values**, derived from the ramp above since the log defines none, and a starting point rather
than a contract:

```
--chart-1 oklch(0.683 0.112 161.7)     the green, same as --primary
--chart-2 oklch(0.563 0.016 164.4)     the light --muted-foreground grey
--chart-3 oklch(0.490 0.014 164.4)     from hsl(150 5% 37%)
--chart-4 oklch(0.405 0.011 164.4)     from hsl(150 5% 28%)
--chart-5 oklch(0.288 0.012 173.3)     the dark lines grey
```

The sidebar set mirrors the surfaces and brand tokens in each mode, so `--sidebar` takes
`--background`, `--sidebar-foreground` takes `--foreground`, `--sidebar-primary` and
`--sidebar-primary-foreground` take `--primary` and `--primary-foreground`, `--sidebar-accent` and
`--sidebar-accent-foreground` take `--accent` and `--accent-foreground`, `--sidebar-border` takes
`--border`, and `--sidebar-ring` takes `--ring`.

**Theme bindings**, all inside the existing `@theme inline` block:

```css
--font-sans: var(--font-outfit), ui-sans-serif, system-ui, sans-serif;
--font-serif: var(--font-nunito), ui-serif, Georgia, serif;
--font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;
--font-heading: var(--font-outfit), ui-sans-serif, system-ui, sans-serif;
--color-destructive-foreground: var(--destructive-foreground);
```

`--font-heading` stays, because seven components use `font-heading` and dropping it would unstyle
them silently. It resolves to Outfit, so there are still only three families: the React app had a
separate heading family, but the log maps headings to Outfit. Drop Playfair Display and nothing else.
Keep the radius scale as the scaffold has it (`sm` at 0.6 times the radius through `4xl` at 2.6
times) and keep every existing `--color-*` and `--color-sidebar-*` binding.

**Font loaders** in `app/layout.tsx`, replacing Geist, Geist Mono, Noto Sans and Playfair Display:

```tsx
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
```

All three are variable fonts with a `latin` subset, so no `weight` is needed. All three variable
classes go on the html element. Keep `antialiased` and `h-full`, keep the `LayoutProps<"/">` signature,
keep the existing metadata (branding is the app shell feature's job), and give the body
`selection:bg-primary selection:text-primary-foreground`. Do not add `font-sans` to the body: the html
element already carries it in its class list and the base layer already applies it.

**Surface**: no endpoints, no persistence, no auth. The interface this feature exposes is the set of
CSS custom properties in `:root` and `.dark`, and the Tailwind utilities generated from them by the
theme block. Every one of the 61 components in `components/ui/` consumes that same surface, and seven
of them read `font-heading`.

**Value sourcing**:

| Value produced or displayed | Source |
|---|---|
| Every light and dark colour value | Converted from the engineer's extracted theme log, each row annotated with its hsl above |
| `--primary-foreground` in both modes | The log's dark ink, `hsl(160 15% 10%)`, chosen because white on the green measures 2.71 to 1 |
| Dark `--destructive` | Lightened to `hsl(0 84% 60%)`, a deliberate departure from the log, because the extracted red measures 1.93 to 1 on the dark background |
| Dark `--border` and `--input` | The scaffold's existing alpha values, kept rather than the log's opaque greys, so `dark:hover:bg-input/30` still reads as a hover |
| `--chart-1` through `--chart-5` | Derived from the ramp above; the log defines none, and the values are not a contract |
| The sidebar set | Mirrors the surface and brand tokens in each mode |
| Radius scale | The scaffold's multipliers, with `0.725rem` from `AGENTS.md` |
| Font family names and fallbacks | The log's `@theme` bindings, plus generic families so text still renders if a webfont fails |
| `--font-heading` | Resolves to Outfit, so seven components keep working without a fourth family |
| Contrast figures quoted in AC-5 and AC-9 | Computed from the chosen values against their own backgrounds, not estimated |

**Key invariants**:
- Token names never change. The standard shadcn names are the contract every component reads, and
  every one of the 61 components already depends on them.
- The theme block stays `@theme inline`, never plain `@theme`. It reads each raw value straight into
  the utility, and it lets the font stacks compose. Nothing about the opacity modifier path depends on
  it.
- No `@theme` entry points at itself. That is a variable cycle and it computes to nothing silently.
- One definition per custom property. Loading a second font into an existing variable name silently
  replaces the first.
- Colours are authored in oklch, in `app/globals.css` only. No component file hardcodes a colour.
  `rgb()` with an alpha channel is allowed for a shadow value.
- `@custom-variant dark (&:is(.dark *));` and the three top level CSS imports stay.

**Security model**: not applicable, no data and no auth. One privacy note worth keeping: `next/font`
self hosts the three families and inlines their `@font-face` rules, so no visitor request reaches
Google. That is the right default for a public site and means no consent banner is needed for fonts.

**Configuration required**: none. No new environment variables, credentials or third party accounts.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: `pnpm dev`, the throwaway theme route renders every Button variant and size in light
  mode with the green primary, the 0.725rem radius and Outfit, verifies **AC-1**, **AC-4**, **AC-7**
- Failure case: `bg-primary/80` renders translucent rather than fully opaque, and `font-heading`
  still resolves rather than falling through to the generic sans, verifies **AC-6**, **AC-4**
- Dark mode: a `className="dark"` on the html element repaints the surfaces, keeps the green, and
  destructive text stays readable, verifies **AC-8**, **AC-9**
- Regression guard: `pnpm build` and `pnpm lint` pass, verifies **AC-10**

## Build plan

The project builds by Tracer Bullet, thin slices proved end to end before the next one starts. Here
that means standing the whole token path up at once, tokens plus fonts plus one real component
consuming them, and only then thickening the parts nothing proves yet. The order below follows that:
the early tasks are the ones that would invalidate everything after them.

- [x] 1. Write the Veni light and dark token values into `app/globals.css`, with the radius at 0.725rem, the
      dark ink as `primary-foreground`, the lightened red as the dark `destructive`, and the scaffold's
      alpha kept for dark `border` and `input`, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-9**
- [x] 2. Replace the four scaffold font loaders in `app/layout.tsx` with Outfit, Nunito and JetBrains Mono on
      their own variables, keeps the `LayoutProps<"/">` form and the current metadata, and stops
      shortloading a fourth family for headings, satisfies **AC-4**
- [x] 3. Rework the theme binding block: `@theme inline` kept, the three font bindings with generic
      fallbacks, `--font-heading` repointed at Outfit rather than removed, and
      `--color-destructive-foreground` added, satisfies **AC-4**, **AC-6**
- [x] 4. Prove the thin slice. Nothing in the repo currently renders a Button, and `app/page.tsx` hardcodes
      `bg-zinc-50`, `bg-white`, `bg-black` and `text-black`, so it cannot show the theme. Create a
      throwaway `/theme` route that renders all six Button variants across all eight sizes (the Button has
      eight, not seven) plus a swatch of the token values, run the app and check it in light mode, then
      delete the route when the checks pass, satisfies **AC-1**, **AC-6**, **AC-7**
- [x] 5. Add the chart and sidebar tokens from the ramp, satisfies **AC-2**
- [x] 6. Adjust the base layer: add no letter spacing rule, leave `--tracking-normal` at Tailwind's default
      since three components use `tracking-normal`, add the selection colours to the body, add no heading
      rules and no `font-sans` on the body, satisfies **AC-12**
- [x] 7. Set `components.json` `baseColor` to neutral, satisfies **AC-11**
- [x] 8. Check both modes by hand on the theme route with `className="dark"` on the html element, then run
      `pnpm build` and `pnpm lint`, satisfies **AC-8**, **AC-9**, **AC-10**

Built and self checked on 2026-10-04. `pnpm build` passes. `pnpm lint` reports 125 errors, all
pre-existing in the generated shadcn components; the two that were in `app/layout.tsx` are gone and
nothing new was added.

Verified against the running app on 2026-10-05. All twelve criteria met, AC-7 included, which the first
verification pass had to record as blocked because no route rendered a Button. The throwaway route is
now deleted, as task 4 asks, so `pnpm build` ships only `/`. After the deletion `pnpm build` exits 0,
`pnpm lint` is back to 125 errors and `pnpm test` passes 81. Note for anyone removing a route: `.next`
holds a generated validator that still names it, so delete `.next` before rebuilding or the type check
fails on a module that no longer exists. Full run record in `verify.md`.

## Consequences

**Positive**:
- The app stops rendering taupe, and the green is legible as text everywhere it appears.
- Every token a shadcn component might reference is defined, so adding a component stops being a
  risk. That matters more than it sounds, with 61 components already in the tree.
- One colour space in the file, which is the state the Button's `color-mix` rule wants.
- Four webfonts become three, and no request leaves the app for fonts.

**Negative / tradeoffs**:
- The greens, greys and the red are sampled from preview images, so they are close but not exact. The
  ramp will need a pass against a real screen.
- The brand green is 3 points more saturated than the hex in `AGENTS.md`, so that file carries a value
  the app does not use.
- White on the primary is gone. Any future assumption that a primary coloured surface takes white
  text is wrong here and has to be checked rather than assumed.
- White on the light destructive red is 3.76 to 1, under the 4.5 bar. That matches the Tailwind and
  shadcn default red, and the base sera Button paints destructive as a subtle tint rather than solid,
  so nothing in the repo hits it today. It would bite a component that fills a surface with
  `bg-destructive` and white text.
- Nothing renders the chart and sidebar tokens, so their values are derived rather than designed, and
  `--chart-5` at `oklch(0.288 …)` sits close to the dark background. They are a starting point, not a
  decision.
- Changing `baseColor` to neutral only changes which palette clobbers the greens, it does not prevent
  it, so the globals.css diff still needs reviewing after every add.
- Dark mode is only reachable by hand until the theme provider feature lands, so AC-8 has no
  automated check.

**Neutral**:
- Heading sizes and the type scale are still unset, by decision.
- The selection colour follows the primary, so selected text is dark ink on green.
- `font-heading` survives as an alias rather than disappearing, so the React app's fourth heading
  family is gone while the utility name stays.

## Follow-up

- [x] Reconcile the primary hex in `AGENTS.md`. It records #52ab82 and roughly `hsl(153 38% 49.6%)`;
    the built value is the latter, which is #4eaf83. One line, at the next state sync. _Done
    2026-10-05. `AGENTS.md` now records `oklch(0.683 0.112 161.7)` and #4faf83, and says plainly
    that #52ab82 is a different colour that does not ship._
- [ ] Look at the theme on a real screen and correct any value that reads wrong. The ramp came from
    sampled images.
- [ ] Keep reviewing the `app/globals.css` diff after every `npx shadcn add`. Moving to neutral
    reduces the chance of a clobber, it does not remove it.
- [x] Correct the `@theme` gotcha in `AGENTS.md`. It records that a plain `@theme` block cannot carry
    an opacity modifier on a colour written as `hsl(var(--token))`. Compiling the installed Tailwind
    shows it can, because the modifier goes through `color-mix`. The block stays inline for the
    reasons in Rationale, but the stated reason is wrong and will mislead a later build. _Done
    2026-10-05, with the real reasons for `inline` written in its place._
- [x] Correct two other stale claims in `AGENTS.md`. It says only `components/ui/button.tsx` has been
    added, when there are 61 components and seven of them use `font-heading`. It also records the
    primary as both `hsl(153 38% 49.6%)` and "roughly #52ab82", which are different colours: the hex
    is `hsl(152.4 35.2% 49.6%)`. _Done 2026-10-05. The font section, the shadcn `baseColor` note and
    the Current state section were stale in the same way and were corrected too._
- [ ] The `tailwindcss` skill installed at the user level governs the conventions in this file and is
    not yet referenced in root `AGENTS.md`; these conventions apply to every file in the project and
    belong at root level.
- [ ] Non text contrast is still open. The border token sits near 1.24 to 1 on the light background and
    the light muted foreground passes by only 0.06, both worth revisiting in the deferred
- [ ] Read the theme on a real screen and correct any value that reads wrong. Two verifications agree
    on every value, but both drove a headless browser, which is not a calibrated display.

## Verification outcome: 2026-10-05

All twelve criteria met on the running app, none blocked. Two full passes, the second with a real
pointer so hover rules applied. `pnpm build` exits 0, `pnpm lint` is at 125 errors with nothing new in
any file this feature owns, `pnpm test` passes 81. The throwaway route is deleted as task 4 asks.
Full evidence and the method traps are in `verify.md`.

Owed to later features, not to this one:

- Dark mode is still only reachable by adding `dark` to the html className by hand. No provider sets
  it, so AC-8 has no lasting automated check. Scope feature 2.
- `app/page.tsx` still hardcodes zinc, black and white, so the landing page cannot show the theme.
  Scope feature 3.
- `text-destructive` on the light background is 3.76 to 1, under the 4.5 bar, and
  `--destructive-foreground` on `--destructive` is 3.61 to 1 in both modes. Nothing in the repo hits
  either today because the destructive Button paints a 10 percent tint rather than a solid fill. A
  component that fills a surface with `bg-destructive` and white text would.
- `--chart-5` is 1.37 to 1 on the dark background, so it is nearly invisible as a dark chart colour.
  Still a starting point, not a decision.
