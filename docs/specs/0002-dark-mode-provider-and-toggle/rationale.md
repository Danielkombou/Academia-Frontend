# Rationale: 0002. Dark mode provider and header toggle

The decision record for spec 0002. `/feature-build` skips this file; it exists so the reasoning
survives the build and so a later reader can see why the obvious alternatives lost.

## Context

The Veni theme ships two complete palettes. `app/globals.css` defines the light values under
`:root` and the dark values under `.dark`, and the very first line of that file redefines
Tailwind's `dark` variant so it keys off a class rather than the operating system preference.
Spec 0001 proved both palettes by adding the class by hand, and its own verification notes record
dark mode as owed to this feature. Until it lands, the app renders light for everyone and half the
theme is unreachable.

The React reference app keys dark mode off the operating system using
`@media (prefers-color-scheme: dark)`. It has no toggle. A header control is therefore a
deliberate departure from parity, and the only one the scope allows, since the scope puts the
control in user settings later rather than dropping it.

Veni runs entirely in the browser and has no server, no account and no database. Everything it
knows about a visitor lives in that browser, which shapes the whole decision: the saved choice
has nowhere to go but local storage, and no route can read it on the server without making every
page render per request.

Three forces pull against each other. The palette must be right at first paint, because a white
flash on a dark laptop reads as a broken page. The html element must not be rendered differently
by the server and the browser, because React treats that as a mismatch. And the amount of code
this project owns should stay small, because dark mode is not the product. Veni is a certificate
generator, and this is one control in its header.

## Options considered

### Option 1: `next-themes`, configured in a thin wrapper

A small client component wraps the `ThemeProvider` the package exports, passing `attribute`,
`defaultTheme`, `enableSystem`, `disableTransitionOnChange` and `storageKey`. The package renders
its own script into the page head, applies the class, listens for changes in the operating system
and for the storage event, sets the browser colour scheme, and wraps every local storage call in a
try catch. The control reads the current choice from its `useTheme` hook.

**Pros**:
- Every behaviour this feature needs is already written and shipped, including the two that are
  easy to get subtly wrong, the script that runs before paint and the class write that must not
  disagree with what React renders.
- Around fifteen lines of provider code and fifty of control code, most of it shadcn markup.
- It is the path shadcn's own documentation uses, so the next person to look finds answers.
- It already runs in production on Next 16 and React 19 elsewhere in this engineer's work, so the
  version risk is settled by evidence rather than by a peer range on paper.

**Cons**:
- The theme logic lives in another package, so its conventions cannot be shaped to this repo and a
  behaviour we disagree with means a wrapper, not a fix.
- It is a new runtime dependency for what is ultimately one class on one element.
- Its live operating system listener uses the browser call `MediaQueryList.addListener`, which the
  standards marked deprecated years ago. Every current browser still ships it.

### Option 2: A hand written provider

A React context holding the choice and the applied theme, plus two small effects, one for the
operating system media query and one for the storage event, and a blocking script printed into the
html head. Around forty lines, no dependency, and every line under this repo's control.

**Pros**:
- No new dependency, and no behaviour hidden outside the tree.
- Both listeners can use the current `addEventListener` form rather than the deprecated one.
- Full control over exactly what runs and in what order.

**Cons**:
- The script that runs before paint is the part everyone gets wrong, and it is the part a bug in
  shows up as a white flash that is easy to miss in a quick look and hard to trace later.
- Every fix and every behaviour change is ours to maintain, for a control that is not the product.
- The reference project in this engineer's own work solves the same problem with Option 1, so a
  second hand rolled implementation in the same week is a second thing to keep in step.

### Option 3: A cookie read on the server

The layout reads a cookie and puts the class on the server, which removes the flash with no script
at all. The visitor's choice is set client side and read on the next request.

**Pros**:
- No flash by construction, because the server sends the class already on the element.
- No inline script, and therefore nothing to worry about under a strict content security policy.

**Cons**:
- Reading a cookie in the layout forces that subtree to render per request, so those routes can no
  longer be served as a static file. That is a real cost for a tool whose whole argument is that it
  runs in the browser.
- A cookie is sent with every request for the rest of the session, to store one word.

## Rationale

The engineer expressed a preference for the simple path once the cost of the hand written version
became clear, and pointed at the working setup in `~/Projects/FlynnSphere/syntax-spring`, which
uses exactly Option 1. That reference settles the two things the peer range alone could not. It
runs `next-themes` 0.4.6 on Next 16.1.1 with React 19.2.3 in production, so neither framework
version is a risk, and it needs no guard code, no normalising effect and no listener of its own.

Reading the published build confirmed the four behaviours this design leans on. It renders its own
synchronous inline script, which is why the answer to where that script goes became a provider prop
rather than a component of ours. It registers a `storage` listener keyed on `storageKey`, which is
how other tabs follow. It wraps `localStorage.getItem` and `localStorage.setItem` in try catch,
which is why blocked storage needs nothing from us. And it sets `documentElement.style.colorScheme`
when `enableColorScheme` is on, which is what makes native controls match.

One correction to the shape of that script, since it changes how AC-1 should be read. It is emitted
as part of the provider's own React output, so it lands at the top of the body segment ahead of the
page content, not in the head. It is inline and synchronous, so the browser runs it as soon as the
parser reaches it and the class is set before the first paint. The no flash behaviour is real. The
head placement is not what delivers it. The build proved this the hard way: with every external
script blocked so React never hydrates, the page still renders the dark palette, which means the
class came from the served HTML and not from the bundle.

The control could be materially simpler, and the spec should be honest about why it is not. The
reference implementation renders both the Sun and the Moon and swaps them with `dark:` utilities, so
CSS picks the icon and the server and the browser always agree. That removes the mounted gate, the
placeholder sizing and the hydration question entirely. It cannot express one thing this feature
promises: a Monitor icon while following the system. A choice between the two is all CSS can
represent, and the third state is the state the reference app spends all its time in. Paying for
one third state is what the gate, the placeholder and AC-12 exist for, so the trade is stated here
rather than discovered later.

The one thing it does not do is reject a saved value it does not recognise: it adds whatever
string it finds straight onto the html element as a class token. A hand edited value of `banana`
therefore renders light with nothing marked in the menu, rather than falling back to the system.
We considered a normalising effect and dropped it. Only hand edited storage causes it, the failure
is silent and harmless, and `classList.add` sits inside the library's try block, so a value with a
space in it throws there and is swallowed rather than breaking the page. Guarding it would be code
we own, test and maintain to cover a case a visitor cannot reach.

Two pieces of our own code remain and both were chosen deliberately. The placeholder until mounted
is what the scope asks for, and it is more than tidiness: the server has no way to know the saved
choice, so the first client render can disagree with the server's. Rendering a same size
placeholder makes that mismatch impossible and keeps the header from jumping. The build measured
it, and the placeholder and the real trigger are both exactly 40 by 40 with the same 14 pixel icon
box. The real radio group is kept over a tinted background because it tells assistive technology
which item is chosen, where a colour alone does not.

The generated `DropdownMenuRadioItem` draws a check mark. We edit that to a dot, because the
engineer chose a dot and the underlying primitive is a genuine radio group either way.
`components/ui/dropdown-menu.tsx` is generated source this project owns, nothing else in the repo
renders it yet, and shadcn's own registry ships a different style, so the edit is contained. The
edit needed one thing the design time pass could not have predicted: the dot has to be `block`.
Tailwind's width and height are ignored on a bare inline `span`, so the first attempt typechecked,
built, and reported the right colour and radius while rendering at zero by zero, which is invisible.

## Evidence gathered while designing

- The published `next-themes` 0.4.6 build was read to confirm the four behaviours above, the
  `storage` listener keyed on `storageKey`, the try catch around both storage calls, and the
  deprecated `MediaQueryList.addListener` used for live system following.
- `~/Projects/FlynnSphere/syntax-spring` was read as a working reference: the same package, the
  same wrapper shape, and a dropdown with three items.
- jsdom in this repo was run to confirm `window.matchMedia` is `undefined` rather than merely
  incomplete, which is what turned the test stub into a build task rather than a nice to have.
- base UI's `MenuRadioItem` was read to confirm it emits `role="menuitemradio"` and `aria-checked`,
  which is what AC-5's screen reader claim rests on.