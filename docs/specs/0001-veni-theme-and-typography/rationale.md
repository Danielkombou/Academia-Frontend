# Rationale: Apply the Veni theme and typography

**Spec**: [0001](index.md) · **Date**: 2026-10-04

## Context

> ⚠️ Premise note: the theme log was sampled from preview images, so every value in it is an
> approximation rather than a measured brand value. The brand green already shows it: the log's
> `hsl(153 38% 49.6%)` works out to #4eaf83, while the hex recorded in `AGENTS.md`, #52ab82, is
> `hsl(152.4 35.2% 49.6%)`. Same hue within 1 and same lightness, but 3 points more saturated in
> the log. Treat the ramp as a good starting point and correct it against a real screen, not as the
> finished brand palette.

The scaffold came from `create-next-app` with shadcn on the base sera style and base color taupe, so
`app/globals.css` currently holds the taupe oklch palette and a near black primary. `app/layout.tsx`
loads Geist, Geist Mono, Noto Sans and Playfair Display. None of that is Veni.

`AGENTS.md` already settles the design direction: a green primary at `hsl(153 38% 49.6%)` roughly
#52ab82, a radius of 0.725rem, and Outfit for sans, Nunito for serif and JetBrains Mono for mono, all
loaded through `next/font/google`. What was missing was the application of any of it. The engineer
has since supplied a full extracted theme log, light and dark, which is the design source for this
spec and settles the rest of the ramp.

Two things raise the cost of getting this wrong. Every later slice renders against these tokens, so
a mistake here is re discovered in all five flow steps. And shadcn components reference tokens the
app never renders itself, so a token that is silently missing does not throw, it just produces an
unstyled component.

Three traps are already recorded in `AGENTS.md`, and the supplied theme log walks straight into two of
them. One is real: `--shadow-custom: var(--shadow-custom)` inside `@theme` points a token at itself,
which is a variable cycle, so any shadow using it silently computes to nothing. The other does not
hold up. `AGENTS.md` records that a plain `@theme` block cannot carry an opacity modifier on a colour
written as `hsl(var(--token))`, which is what `bg-primary/80` and `ring-ring/30` in the base sera
Button use. Compiling the installed Tailwind shows the modifier is applied through `color-mix`, so
plain `@theme` works too. The block stays `inline` for the reasons in Rationale, not that one, and
`AGENTS.md` needs that line corrected.

The log also drops the chart and sidebar tokens. Nothing in the repo reads them today, but the chart
and sidebar components do, so a component that arrives later would find them missing.

One more thing the context files get wrong. `AGENTS.md` says only `components/ui/button.tsx` has been
added. There are 61 components in `components/ui/`, and seven of them use `font-heading`. This spec
was written against the one component picture and has been corrected against the real tree.

Not deciding this leaves the app rendering taupe with four unused fonts loaded, which is the state it
is in now.


## Options considered

### Option 1: Port the theme log exactly as written

Copy the log in verbatim: bare hsl channel triplets, a plain `@theme` block, the self referential
shadow, the three step radius scale, and no chart or sidebar tokens.

**Pros**:
- Exactly what was extracted, so the result matches the preview screenshots with no interpretation.
- Nothing to convert, so no conversion can be wrong.

**Cons**:
- The self referential shadow is a variable cycle, so the shadow silently computes to nothing.
- Two colour spaces in one stylesheet, which the Button's `color-mix(in oklch, ...)` rule then has to
  straddle.
- Dropping the larger radius steps leaves `rounded-xl` through `rounded-4xl` undefined for any
  component that reaches for them.

### Option 2: Port to oklch with an inline theme block, keep the scaffold's scale and add the missing tokens

Convert every value from the log into oklch, bind them through `@theme inline`, keep the scaffold's
radius multipliers on top of the 0.725rem radius, and add the chart and sidebar tokens from the same
ramp.

**Pros**:
- Matches how the file already works and how `AGENTS.md` says colours are authored.
- Keeps the `color-mix(in oklch, ...)` rule in the Button mixing like with like.
- `inline` reads the raw value straight into each utility, so a theme value can also compose, which is
  what the font stacks need.
- Every radius step and every token a shadcn component might reference stays defined.

**Cons**:
- The conversion is a judgement call on each value, so the result is very close to the preview rather
  than bit for bit identical to it.
- More tokens to maintain than the log carries.

### Option 3: Keep the hsl triplets, fix only the broken constructs

Leave the values as bare triplets and change only the `@theme` to inline.

**Pros**:
- Smallest possible diff from the log, and the real trap is still fixed.
- The triplets stay readable for anyone comparing against the preview.
- Nothing about the opacity modifier path depends on the colour space, so this is genuinely viable.

**Cons**:
- Departs from the project's rule that colours are authored in oklch, for no gain.
- Leaves the Button's `color-mix(in oklch, ...)` mixing an oklch foreground into hsl values, which
  works but leaves two colour spaces in one declaration.

### Option 4: Let shadcn generate the palette from a base color

Set `components.json` to a base color and let the shadcn CLI write the Veni theme into
`app/globals.css`.

**Pros**:
- The file stays exactly as the tool expects it, so future adds are consistent by construction.
- No hand conversion at all.

**Cons**:
- shadcn's base colors are a fixed set of palettes. None of them is this green, so the result would
  not be the Veni theme.
- The CLI rewrites `app/globals.css` wholesale, which is the clobber risk `AGENTS.md` warns about,
    not a cure for it.


## Rationale

Option 1 is the only option that carries a real defect. `--shadow-custom: var(--shadow-custom)` is a
variable cycle, so any shadow using it computes to nothing with no error to show for it, and the two
colour spaces leave the Button's `color-mix(in oklch, ...)` rule straddling both.

I first wrote this Rationale on the claim that a plain `@theme` block cannot carry an opacity
modifier, which is what `AGENTS.md` records and what `bg-primary/80` and `ring-ring/30` in the base
sera Button rely on. Compiling the installed Tailwind refutes it: the modifier goes through
`color-mix`, so plain `@theme` carries it too. The block stays `inline` on the real reasons, which
are that it reads the raw value straight into each utility instead of hopping through a variable, and
that it lets a theme value compose, which the three font stacks need. `AGENTS.md` should lose that
gotcha, because a future reader will otherwise find a way to "fix" the block back.

That leaves Option 3 as a real alternative rather than a straw man, and it is only the project rule
that colours are authored in oklch that settles it. Given the Button already mixes in oklch, keeping
hsl triplets in the same file for the sake of readability would buy very little.

Option 4 is out on the substance: shadcn's base colors are fixed palettes and none of them is this
green, and the CLI rewriting `globals.css` is the clobber risk rather than a cure for it.

On the colours themselves: the extracted triplet beats the recorded hex for the ramp, because every
other token came from the same extraction and stays consistent with it. The cost is small, 3 points of
saturation and under 1 of hue, but it does mean the hex in `AGENTS.md` is not literally what ships.
That is a follow up, not a reason to hold up the theme. The dark destructive red is the one place I
departed from the log outright: at `hsl(0 62.8% 30.6%)` it reaches 1.93 to 1 on the dark background,
and the Button renders destructive text in dark mode, so an extracted value that reads as almost
nothing is a defect rather than a design choice. The lighter red measures 5.11 to 1.

On scope: heading sizes, weights and the hero type belong to the app shell feature, where there is a
real page to size them against. Setting a type scale here would be a guess about a screen that does
not exist yet.

