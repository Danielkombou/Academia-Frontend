# 0004. Rationale

**Date**: 2026-10-06

## Context

The reference app at `~/Projects/veni-react` loads a template through two paths in
`src/templateUtils.ts`. An image goes through `getImageTemplate`: read the file to a data URL (a
base64 string with the file's bytes inline), decode it with an `Image`, and if the longest side is
over `MAX_EMBED_SIDE_PX` (3508) draw it onto a canvas at a reduced scale and take the canvas output
instead. A PDF goes through `getPdfTemplate`: read the file as an `ArrayBuffer` (raw bytes), hand it
to `pdfjs-dist`'s `getDocument`, take page one only, compute a scale as the smaller of 300 divided by
72 (points to inches, so 300 dots per inch) and 3508 divided by that page's longest side at scale 1,
render it to a canvas with `Math.ceil`, and return the canvas as a JPEG data URL at quality 0.95. The
image path rounds instead of ceiling, and that difference is carried over rather than tidied.
`App.tsx` owns three pieces of state (`templateFile`, `templatePreviewUrl`, `templateDims`), and the
upload handler catches everything, clears all three, and fires one alert: `Sorry, this template could
not be loaded. Please try a different file.`

Four forces shape what this port does.

First, `pdfjs-dist` has to run in the browser only, and its worker has to be pointed at. The
reference does it in one line at the top of `templateUtils.ts`, using Vite's `?url` import suffix.
There is no `?url` in Next.js, so the equivalent has to be found, and this is the slice where that
gets settled. Every later slice installs another browser only library (`mammoth`, `jspdf`, `jszip`)
and will follow whatever this one settles.

Second, `pdfjs-dist` is roughly a megabyte of JavaScript. The generator route is a client
component, so the megabyte would ship with the page if the import were static. Nobody has to wait
for it to look at step 1, so it is worth loading on the first upload instead.

Third, the parity rule in `AGENTS.md` says the Next.js app must behave exactly like the React app,
and this slice is where that rule gets tested hardest. The reference's step 1 card is bare: it shows
the file name, it has no drop handler even though its copy says "Drop your template here", it shows
no sign of work while a large PDF is being read, its Continue control is clickable before the
template has loaded at all, and its file input is `display:none`, which drops it out of the tab
order. The engineer has decided to fix all of that. Those are six departures, and this spec records
them as departures so a later verification step knows what is supposed to differ and what is not.

Fourth, this slice is the first to hold a large image in memory. A 3508 pixel PNG as a data URL can
be tens of megabytes of string, and slice 4 will hold hundreds of generated PDFs in memory at the
same time. The resolution cap is the reference's defence and it is kept exactly. Converting image
templates to JPEG would be far lighter, and it is not done, because it drops transparency and the
reference does not do it.

## Options considered

### Option 1: Point the worker at the package with `new URL`

The browser only module sets `workerSrc` from
`new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`. Turbopack emits the worker as a
build asset and rewrites the URL to the hashed file it produced.

**Pros**:
- The worker always comes from the installed `pdfjs-dist`, so it cannot drift from the version the
  library is running. This is the exact failure the `react-pdf-kit-worker-config` skill warns about,
  and the pattern makes it impossible rather than merely unlikely.
- Nothing is checked in and nothing has to be copied at install time.
- This is the recipe the Turbopack section of that same skill documents for a Next.js 15 or later
  app, so it is a known path rather than an experiment.

**Cons**:
- It depends on the bundler rewriting a `new URL` expression that names a bare package specifier.
  Next.js's own bundled documentation only shows `new URL` with relative paths, and the skill's
  recipe was written against `pdfjs-dist` 5, not 6. If Turbopack leaves the expression alone, the
  result is a 404 at runtime with no build error, which is exactly the failure this option names as
  its own risk.

### Option 2: Copy the worker into `public/` and point at a path

The worker file is copied into `public/` by a postinstall script or by hand, and `workerSrc` is the
string `/pdf.worker.min.mjs`.

**Pros**:
- Dead simple to read, and easy to debug by opening the file in a browser.
- No dependence on how the bundler handles a `new URL` inside `node_modules`.

**Cons**:
- The copy can drift from the installed version, and a mismatched worker fails at runtime with a
  version error rather than a clear one. Getting that right needs a script, and a script that must
  keep working across upgrades is its own small project.
- A generated file in `public/` is invisible in review, so a stale copy is easy to miss.

### Option 3: Set no `workerSrc` at all and let pdfjs use its in-process worker

The handler imports `pdfjs-dist` and never touches `GlobalWorkerOptions`. The library falls back to
its own worker build rather than a separate file.

**Pros**:
- Strictly simpler. No asset to emit, no MIME type question, no version drift to argue about, and no
  fallback plan. Rasterising one page of one PDF is cheap enough that a worker may buy nothing.
- Removes the single unproven assumption in the whole spec, which is whether Turbopack emits the
  asset from that `new URL`.

**Cons**:
- The worker build is bundled into the chunk that is dynamically imported, so the first upload still
  waits for it and it is still a megabyte, just in the wrong place.
- Rasterisation blocks the main thread, which is the reason the worker exists at all.

### Option 4: Load on the first upload rather than with the page

The upload handler awaits a dynamic import of a browser only module that wires the worker and does
the work. The alternative is a static import at the top of a `"use client"` module, which is what the
reference does.

**Pros**:
- `/generate` loads without the roughly one megabyte, so step 1 is interactive on a slow connection.
- The module is imported only from an event handler, so it is never part of the prerendered output
  and never runs on the server. That is the whole client boundary question answered by placement
  rather than by a guard.
- A first time visitor who bounces without uploading never pays for it.

**Cons**:
- The first upload waits on a network round trip, so the busy state has to exist for the feature to
  feel right rather than being a nicety.
- One extra module and one extra moving part in the error path, and the boundary is load bearing: a
  future simplification that hoists that import to the top of a file reintroduces the server
  rendering failure the split avoids.

## Rationale

Options 1, 2 and 3 all work, and the deciding force is the version mismatch. `pdfjs-dist` fails at
runtime when the worker it loads is not the build of the library that loads it, and that failure is
easy to cause and hard to read. Option 1 makes it structurally impossible, because the URL points
into the installed package and moves with it. Option 2 needs a copy step to stay honest, and a copy
step that nobody checks is exactly how the mismatch happens. Option 3 sidesteps the question by never
loading a separate worker, and gives up main thread rasterisation to do it. The cost of Option 1 is
that it leans on the bundler to emit an asset for a bare specifier, which no document in the repo
confirms for this combination of bundler and library major. That is why it is the first build task
and why Option 2 is written into the build plan as the fallback rather than left to judgement in the
moment.

Option 4 over a static import is about what a visitor pays for before they get anything. The
generator route carries nothing else heavy yet, so this is the cheapest possible moment to decide
that browser only libraries load on demand. Later slices add three more, and if this pattern is
right then, adopting it four times is cheap. Choosing the static import now would mean four modules
marked `"use client"` and four chances to get the server boundary wrong.

The six additions to step 1 are worth stating plainly against the parity rule, because each one is a
departure. The reference promises a drop target in its own copy and does not deliver one; that is a
defect, and making the copy true costs three handlers. The reference lets someone click Continue
before their template has loaded, which produces a flow at step 2 with no template and no
explanation; a disabled control and a busy line cost one flag and one line of copy. The reference
cannot retry the same failing file without first picking a different one, because the input still
holds it; resetting the value is one line, taken after the file is captured. Its file input is
`display:none`, which puts it out of the tab order, so the reference's dropzone is not reachable by
keyboard at all; `sr-only` plus `peer` fixes that and is an accessibility change to the port rather
than a port.

The inert cards are the sixth, and the weakest of the six. An earlier draft of this spec claimed they
were not a departure at all, on the grounds that the reference's step components render nothing when
they are not the current step. That is wrong, and worth correcting precisely: the guard in the
reference is `if (step < N) return null`, which suppresses a step only *before* its turn. At position
2 the reference shows the real names form at step 2 and collapsed summary rows for steps 3 and 4. So
the reference does render placeholders for later steps, it renders them as summaries of work that has
happened rather than as notices that work has not, and at position 2 it renders step 2 for real. The
Veni flow therefore shows something where the reference shows something different, not nothing where
the reference shows nothing. The thumbnail is weak for a different reason: it renders an image the
flow renders again at step 4, and it is included because seeing that a file loaded is worth more here
than the memory it costs at this size.

The state lives on the `/generate` page and the step component stays presentational, which is the
reference's own arrangement and the only one that survives slice 4. That slice has to read the
template's data URL and size from its own card, so a template held inside the step 1 component would
have to be lifted back out later, with a rewrite of both cards. The cost is prop drilling in a
component tree three levels deep, which is not a real cost at this size. Five separate `useState`
fields rather than one reducer is the same judgement: the reducer would make the both or neither
invariant and the token check structural rather than hand maintained across four setters, and it is
the better shape if this card grows. At five fields and one handler it is not worth the extra
indirection, and the engineer confirmed this model before the cross check raised it.
