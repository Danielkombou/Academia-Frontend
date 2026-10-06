# 0004. Upload a certificate template and settle the browser client boundary

**Date**: 2026-10-06
**Status**: In Progress

## Summary

Step 1 of the Veni flow accepts a PNG, JPG or PDF certificate template and turns it into one image
the later steps can reuse. A PDF is rasterised from its first page in the browser (drawn onto a
canvas, a picture held in memory) by Mozilla's `pdfjs-dist`, loaded on demand rather than with the
page, and the template is capped at 3508 pixels on its longest side so a large file does not quietly
eat the browser's memory. This is a port of the reference app's `templateUtils.ts`, with six
deliberate departures the engineer asked for: a thumbnail, a working drop target, a busy state, an
input that can be retried with the same file, cards for the steps that do not exist yet, and one
pick winning over another. The slice also settles how a browser only library and its worker are wired
in this app, which the next three slices copy.

## Requirements

**User stories**:
- As a person making certificates, I want to drop or choose a template file so that the rest of the
  flow has a page to draw names on.
- As a person making certificates, I want to see that my file loaded, and see the page itself, so
  that I know I picked the right file before going further.
- As a person making certificates, I want to be told plainly when a file will not work, so that I do
  not sit wondering why nothing happened.
- As a person on a slow connection, I want step 1 to load without waiting for the PDF library, so
  that the page is usable straight away.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: Step 1 renders a card headed `Upload Certificate Template` with a `Step 1` badge, a
  dropzone reading `Drop your PNG / JPG / PDF template here` or `click to browse`, the hint
  `Recommended landscape 2970x2100px · PDF first page is used`, and a Continue control labelled
  `Continue to Step 2 →`. All five strings are verbatim from the reference's `StepTemplate.tsx` or
  `App.tsx` and are not to be reworded.
- **AC-2**: A PNG or JPG template loads through the reference's own image path. The result is the
  file's data URL, its natural width and height, and the format `JPEG` only when the file's MIME type
  is `image/jpeg`, `PNG` otherwise.
- **AC-3**: A PDF template rasterises page one only. The scale is the smaller of 300 divided by 72
  and 3508 divided by that page's longest side at scale 1. The page is rendered with
  `page.render({ canvasContext, viewport, canvas })`, the canvas is sized with `Math.ceil`, and the
  result is a JPEG data URL at quality 0.95 whose recorded width and height are the canvas's. The
  document loading task is destroyed in a `finally`, whether or not the render succeeded.
- **AC-4**: An image whose longest side is over 3508 pixels is redrawn on a canvas whose longest
  side is exactly 3508, sized with `Math.round` on both sides. The canvas is exported with
  `toDataURL("image/jpeg", 0.95)` for a JPEG source and `toDataURL("image/png", 0.95)` otherwise, and
  the recorded width and height are that canvas's.
- **AC-5**: Once a template has loaded, the card shows `Selected: <file name>` and a thumbnail of the
  loaded image, capped at 16rem tall, with `object-contain` so a portrait template stays fully
  visible. The thumbnail's source is the template data URL passed down as a prop, and its
  alternative text names the file.
- **AC-6**: While the file is being read, the file input carries `disabled`, the dropzone label
  carries `aria-disabled` and `pointer-events-none` so clicking it cannot open the picker, and a busy
  line reads `Reading template...`. Continue is absent entirely until a template has loaded, and is
  disabled whenever the busy flag is true. The drop handlers stay live throughout, so a drop during a
  read is honoured as a superseding pick (AC-10).
- **AC-7**: A file that cannot be read, decoded, rasterised or rendered clears the file, the data URL
  and the size, leaves the busy flag false, and fires exactly `Sorry, this template could not be
  loaded. Please try a different file.` Nothing else is reported. A canvas export that returns
  anything not starting with `data:image/` is treated as a failure and takes this same path, rather
  than storing a value that would poison slice 4.
- **AC-8**: The file input carries `accept=".png,.jpg,.jpeg,.pdf"`. The dropzone also accepts a
  dropped file by pointer, and takes the first file when several are dropped at once. A drop that
  carries no files at all, such as dragged text or a dragged link, is a no op: no state change, no
  busy flag, and no alert.
- **AC-9**: Picking or dropping the same file twice in a row works both times. The handler captures
  `files[0]` first and then sets `input.value = ""` synchronously, before any `await`, so the file
  list is read before it is cleared.
- **AC-10**: When one pick is still being read and a second arrives, the second is the one that
  lands. The handler bumps a token as its first action and captures it, and only the current token
  may write state, clear the busy flag or alert. A superseded pick resolves silently: no alert, no
  state write, no busy flag change.
- **AC-11**: `pdfjs-dist` is loaded by a dynamic import inside the upload handler, so the first load
  of `/generate` does not download it.
- **AC-12**: `GlobalWorkerOptions.workerSrc` is set from
  `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)` inside the module that is only
  ever imported in the browser, and the worker file comes from the installed `pdfjs-dist` rather than
  from a copy in the repository. The worker request returns 200 as JavaScript.
- **AC-13**: The `pdf-client` module is imported exactly once, from inside the pick handler. No module
  that imports `pdfjs-dist` is imported by a server component, pulled in while the route prerenders,
  reachable from the root layout, or imported for real by a test. Its test uses a mock. `/generate`
  still prerenders as static content.
- **AC-14**: Once the flow is past step 1, step 1 collapses to a summary row showing the file name
  and a `Change` control that returns the flow to step 1, exactly as the reference does.
- **AC-15**: Advancing past step 1 renders an inert card for each of steps 2 to 5. Each shows its
  number, the scope's own name for that step, and one line naming the scope feature that builds it:
  step 2 is `Names upload` in feature 5, step 3 is `Position and name formatting` in feature 6, step
  4 is `Preview and generate` in feature 7, and step 5 is `Download the batch` in feature 8. Those
  cards carry no controls.
- **AC-16**: No file this slice adds contains a raw colour. The card's active and collapsed states
  resolve through theme tokens, the active state being `border-primary/50 bg-card shadow-xl` and the
  collapsed state `border-border bg-muted`, both of which read correctly in either mode with no `dark:`
  variant. The `dark` class on the html element still comes from the theme provider and nothing else.
- **AC-17**: No emoji appears in any file this slice adds. The reference's two 📄 positions are
  lucide `FileText` in the card header and lucide `Upload` inside the dropzone.
- **AC-18**: The step card is hand written markup on theme tokens. It uses plain `div`, `label`,
  `input`, `button` and `img` elements, and does not use shadcn's `Card`, `CardHeader` or
  `CardContent`.
- **AC-19**: The dropzone is a `label` wrapping a file input made invisible with `sr-only` plus
  `peer`, rather than the reference's `className="hidden"`, because `display:none` removes an element
  from the tab order and the reference's version cannot be reached by keyboard. Tabbing reaches the
  input, the dropzone shows `peer-focus-visible:ring-2 peer-focus-visible:ring-ring` while the input
  holds focus, the busy line sits inside an `aria-live="polite"` region, and the thumbnail's
  alternative text names the file. The drag highlight is driven by a `data-dragging` attribute on the
  label rather than by per event class juggling, because `dragleave` also fires when the pointer
  crosses a child element, and is toggled by an enter and leave depth counter.
- **AC-20**: The pure helpers are unit tested: `isPdfFile`, `resolveCapSize`, and `resolvePdfScale`,
  the last two being the cap arithmetic and the PDF scale, both extracted so they can be tested
  without a canvas. The card's failure, retry and overlapping pick paths are tested with `Image`,
  `FileReader` and canvas stubbed, asserting the alert with `vi.spyOn(window, "alert")` and checking
  the exact string once. No native canvas package is added, and `@testing-library/react` and jsdom
  are already installed.
- **AC-21**: `pnpm build` passes and `/generate` still shows `(Static)`. No lint finding sits in a
  file this slice owns; the recorded baseline of 62 errors, all of them in `components/ui/`, is the
  current reading and is expected to drift as shadcn components are added. `pnpm test` passes the 81
  existing tests plus the ones this slice adds.

## Decision

**Chosen option**: Option 1 for the worker, and Option 4 for the library's loading.

Install `pdfjs-dist` at exactly the version the reference resolves to, 6.3.289. No package manager
override is needed, because nothing else in the tree depends on `pdfjs-dist` and a direct dependency
already resolves once. A browser only module sets `workerSrc` from `new URL` against the package and
exports the PDF path; the upload handler reaches it through a dynamic import, so it loads on the
first upload and never during prerender.

Option 3 was considered seriously and is the simpler of the two worker answers. The engineer chose
Option 1 deliberately, and the dynamic import already keeps the megabyte off the first load, so the
extra cost Option 3 avoids is a worker file rather than the bulk of the library. The one thing Option
1 buys that Option 3 does not is a rasterisation that does not block the main thread. Because
Option 1's only risk is unproven, it is the first thing the build does, before any card code exists.

The image path stays synchronous and pure, in a module that imports nothing, so it is testable and
so the first upload of a PNG or JPG does not wait on the megabyte either. Both scale calculations are
extracted as pure functions, `resolveCapSize` for the image path and `resolvePdfScale` for the PDF
path, so both are unit testable without a canvas.

Step 1 ships as a port with six additions the engineer asked for: the thumbnail, real drop handling,
the busy state, the input reset that makes retrying the same file work, the pick token so the latest
pick wins, and the inert cards for the steps that do not exist yet.

**Implementation skills**: `tailwindcss` (`anthropics/skills`, `.agents/skills/tailwindcss/`) ·
`react-pdf-kit-worker-config` (`react-pdf-kit/agent-skills`,
`.agents/skills/react-pdf-kit-worker-config/`) · `react-pdf-kit-nextjs-app-router`
(`react-pdf-kit/agent-skills`, `.agents/skills/react-pdf-kit-nextjs-app-router/`) · `vitest`
(`paulrberg/agent-skills`, `.agents/skills/vitest/`)

The two `react-pdf-kit` skills are written for that library's viewer component, which this app does
not use, so their advice about configuring it through `RPConfig` and about not installing
`pdfjs-dist` separately does not apply here. Their worker recipe, their rule that the worker build
must match the installed `pdfjs-dist`, and their statement that a `pdfjs-dist` consumer cannot be
server rendered are what this spec takes from them.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**: no database, no server, no account, nothing persisted. This extends the one
piece of client state spec 0003 placed on the `/generate` page.

| State | Type | Nullable | Owner | Initial | Cleared by |
|---|---|---|---|---|---|
| Flow position | `number`, 1 to 5 | no | `/generate` page `useState` | `1` | the start over control, which arrives with scope feature 8 |
| Template file | `File` | yes | `/generate` page `useState` | `null` | a failed read, a replacement pick |
| Template data URL | `string`, a base64 data URL, `""` when there is none | no | `/generate` page `useState` | `""` | same as the file |
| Template size | `{ width: number, height: number }` | yes | `/generate` page `useState` | `null` | same as the file |
| Template busy | `boolean` | no | `/generate` page `useState` | `false` | only the current pick, when its own read settles |
| Pick token | `number` | no | `useRef` on the page, bumped as each pick's first action | `0` | never reset; it only ever increases |

Nothing derived is stored, and nothing is written to storage, the URL or a cookie. The thumbnail is
rendered from the template data URL and sized in CSS, so it is not state of its own and costs no
extra memory.

`lib/templateUtils.ts` also has one return type, which is a value and not state:

```ts
interface TemplateImage {
  dataUrl: string;
  width: number;
  height: number;
  format: "PNG" | "JPEG";
}
```

**State transitions**:

```
event                          position   template state            what /generate shows
first render                   1          empty                    the step 1 card and the dropzone
pick or drop a file            1          busy                     the busy line, the input disabled
read succeeds                  1          loaded                   Selected: <name>, the thumbnail, Continue enabled
read fails                     1          empty, one alert         the dropzone again, nothing shown
pick A, then pick B while A reads
                               1          busy on B                the busy line, drop still accepted
B's read succeeds              1          B loaded                 Selected: <B>, the thumbnail
A's read lands afterwards      1          unchanged, silent        unchanged, no alert
Continue                       2          unchanged                the step 1 summary, and cards for 2 to 5
Change                         1          unchanged                the step 1 card again
```

**API surface**: no endpoint, no server action, no server component. Everything below is client side.

| Export or path | Kind | Key inputs | Key outputs | Notes |
|---|---|---|---|---|
| `lib/templateUtils.ts` | plain module, imports nothing | | | The image path, the PDF detection, the return type, and the two pure scale functions. |
| `isPdfFile(file)` | function | `file: File` | `boolean` | True when the MIME type is `application/pdf` or the name ends `.pdf`. The reference's own test, unmodified. |
| `resolveCapSize(width, height)` | function, pure | `width: number`, `height: number` | `null` when inside the cap, otherwise `{ width, height, scale }` | `Math.round` on both sides, to 3508 on the longest side. |
| `resolvePdfScale(baseWidth, baseHeight, targetDpi = 300)` | function, pure | the page's viewport at scale 1 | `number` | `Math.min(targetDpi / 72, 3508 / longest)`. |
| `getImageTemplate(file)` | function | `file: File` | `Promise<TemplateImage>` | Data URL, natural size, `JPEG` only for `image/jpeg`. Downscales through `resolveCapSize`. |
| `lib/pdfClient.ts` | browser only module | | | Sets `workerSrc` from `new URL` at module scope, which is safe because nothing imports it outside an event handler. Imported exactly once, from the handler. Never imported for real by a test. |
| `getPdfTemplate(file, targetDpi?)` | function in the browser only module | `file: File`, `targetDpi` defaulting to `300` | `Promise<TemplateImage>` | `file.arrayBuffer()` into `getDocument({ data })`, page one only, `resolvePdfScale`, `Math.ceil` the canvas, `page.render({ canvasContext, viewport, canvas })`, JPEG at 0.95, `finally { loadingTask.destroy() }`. |
| `components/step-template.tsx` | client component, presentational | `step`, `templateFile`, `templateDataUrl`, `isBusy`, `onTemplatePick(file)`, `onNext()`, `onEdit()` | | Owns the input element, the drop handlers and therefore the input's value reset and the drag depth counter. |
| `app/(site)/generate/page.tsx` | client component | | | Owns the five pieces of state, the pick token ref, the pick handler, and the flow position. |

`lib/templateUtils.ts` and `lib/pdfClient.ts` are camel case on purpose, matching the reference's own
file names so that the port stays a transcription, as the engineer chose. The later slices'
`lib/nameFormat.ts` and `lib/zipUtils.ts` follow the same convention.

**Displayed copy**, drafted here so the build never invents it. The busy line:

> Reading template...

The Continue label is `Continue to Step 2 →`, verbatim from the reference and not to be reworded. The
inert card lines follow the pattern below, for example step 2:

> **Step 2** · Names upload
> This step arrives in feature 5 of this build.

The five strings the reference owns (the alert, the card heading, the dropzone line, the hint, the
`Selected:` prefix) plus the Continue label are verbatim and are not to be reworded. The busy line
and the inert card lines are drafted, so correct anything that reads wrong.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Loading an image template | The data URL | `FileReader.readAsDataURL` on the picked `File` |
| Loading an image template | The width and height | `img.naturalWidth` and `img.naturalHeight` on the decoded image |
| Loading an image template | The format label | `file.type === "image/jpeg"`, the reference's own test. Anything else is `PNG` |
| Downscaling a large image | The new width and height | `resolveCapSize`, `Math.round` on both sides, from 3508 and the natural size |
| Downscaling a large image | The exported type and quality | `canvas.toDataURL(isJpeg ? "image/jpeg" : "image/png", 0.95)`, the reference's own line |
| Deciding the canvas is usable | Whether the export succeeded | The returned string starts with `data:image/`, otherwise it throws |
| Rasterising a PDF | The bytes handed to the library | `file.arrayBuffer()` |
| Rasterising a PDF | The scale | `resolvePdfScale`, the smaller of `targetDpi / 72` and 3508 divided by the longest side of the page's viewport at scale 1 |
| Rasterising a PDF | The width and height | The canvas, sized with `Math.ceil` of the scaled viewport |
| Rasterising a PDF | The rendered pixels | `page.render({ canvasContext, viewport, canvas })`, where `canvas` is required by the library's own signature |
| Rasterising a PDF | The format | Always `JPEG` at quality 0.95, since a PDF has no pixel format to keep |
| Rasterising a PDF | Which page | Always page 1. The reference's choice, and its hint says so |
| Rasterising a PDF | The worker release | `loadingTask.destroy()` in a `finally` |
| Loading the library | Whether the chunk arrived | The dynamic import sits inside the same `try` as the read, so a chunk failure lands on the AC-7 alert |
| Showing the selection | `Selected: <file name>` | `templateFile.name` |
| Showing the thumbnail | The image | The `templateDataUrl` prop, which is the template data URL |
| Showing the thumbnail | Its alternative text | `templateFile.name` |
| Showing the thumbnail's size | Its box | CSS, `max-h-64` with `object-contain`. Not stored, and not the step 4 preview's aspect ratio box |
| Blocking the flow while reading | Whether the controls are live | The template busy flag, cleared only by the current pick token |
| Reporting a failure | The alert text | `veni-react/src/App.tsx`, verbatim |
| Reporting a stale failure | Whether an alert appears | The pick token comparison, which suppresses it |
| Offering files | The accept list | `veni-react/src/components/StepTemplate.tsx`, verbatim |
| Labelling step 1 | The heading, the badge, the dropzone line, the hint and the Continue label | `veni-react/src/components/StepTemplate.tsx`, verbatim |
| Rendering cards for 2 to 5 | Their numbers and names | `docs/scope/scope.md`, the feature names, not invented here |
| Rendering cards for 2 to 5 | Which feature builds each one | The same scope rows' feature numbers: step N is feature N+3 |
| The worker's URL | The hashed asset URL | `new URL` against the installed package, at runtime |
| The applied colour in both modes | The class on the html element | The `veni-theme` provider from spec 0002, which owns it and is not touched here |

**Key invariants**:
- The template data URL and the template size are both set or both empty. There is no state in which
  one exists without the other.
- The recorded size always describes the data URL that was actually produced, after any downscale.
  A size read from the original file paired with a downscaled image would silently skew every later
  position and page size calculation.
- The pick token is bumped as the first action of every pick, and only the current token may write
  state, clear the busy flag or alert. A superseded pick is silent.
- The file input's value is empty after every pick, and is cleared only after `files[0]` has been
  captured, since clearing the value also clears the file list.
- `GlobalWorkerOptions.workerSrc` is set once per session, from the installed package, and never
  from a URL typed by hand.
- No module that imports `pdfjs-dist` is reachable from a server component, a route's default export
  during prerender, the root layout, or a test. It is imported exactly once, from an event handler.
- No raw colour in any new file. The reference's `#aa3bff` becomes `border-primary`, `text-primary`
  and `bg-primary/5`; its `#08060d` becomes `text-foreground`; its `#6b6375` becomes
  `text-muted-foreground`; its `#2e303a` and `#1f2028` both become `border-border` and `bg-muted`.
- No emoji in any new file.
- The six strings that are verbatim from the reference (the alert, the card heading, the dropzone
  line, the hint, the `Selected:` prefix and the Continue label) are not reworded.
- The `dark` class is never written by this slice. The theme provider owns it.
- Nothing in this slice reads or writes storage, a cookie or a request header, so `/generate` keeps
  prerendering as static content.

**Security model**: not applicable in the usual sense. There is no account, no role, no server and
no data at rest. A certificate template is a file the visitor already has, and everything here runs
in their browser, so no template ever leaves the machine. That is a product guarantee worth stating
rather than a security control: there is no upload endpoint to attack, no storage to breach and
nothing to delete later.

Two consequences follow. The `accept` list is a hint to the file picker, not a validation, and a
dropped file is never filtered by it at all, so a file of any type can reach the reader. The
reference's permissive path is kept, so a WebP loads and is labelled `PNG` because only
`image/jpeg` is treated as JPEG. With scripting off none of this runs, and with a browser that
blocks canvas the read throws and lands on the one alert.

**Configuration required**: none. No environment variable, no credential, no third party account.
The one addition is the `pdfjs-dist` dependency at a pinned version.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path, image: pick a PNG under the cap, and the card shows its name, a thumbnail at the file's
  own size, and an enabled Continue. Verifies **AC-1**, **AC-2**, **AC-5**
- Happy path, PDF: pick a landscape PDF, and the thumbnail matches the reference app's own output
  for the same file in the same browser, at the same dimensions, aspect ratio, cap, page one choice
  and 300 DPI target. Byte equality is not the test, since JPEG encoding and resampling are browser
  dependent. Verifies **AC-3**, **AC-12**
- The cap: pick an image longer than 3508 pixels on its longest side, and the recorded size and the
  thumbnail are the downscaled ones, with the aspect ratio unchanged. Verifies **AC-4**
- Failure: pick a file that is not an image or a PDF, and state is cleared, the busy flag is false,
  and the reference's one alert appears. Verifies **AC-7**
- Retry: after that failure, pick the same failing file again, and it is attempted rather than
  ignored. Verifies **AC-9**
- Overlapping picks: start a large PDF, drop a PNG before it finishes, and the PNG's template is what
  stays when both have settled, with no second alert from the abandoned PDF. Verifies **AC-10**
- Loading: watch a large PDF being read, and the input is disabled, the dropzone cannot be clicked,
  the busy line is showing, and Continue is absent entirely before any template loads. Verifies
  **AC-6**
- The boundary: load `/generate` in a fresh session and watch the network panel, and `pdfjs-dist` is
  absent until a PDF is attempted, the worker is fetched once with a 200 as JavaScript, and no server
  console error appears. Verifies **AC-11**, **AC-12**, **AC-13**
- Dropping: drop a PNG onto the dropzone, and it loads exactly as picking it does; drop three files at
  once, and only the first is read; drag text onto it, and nothing at all happens. Verifies **AC-8**
- Past step 1: click Continue, and step 1 collapses to its summary with a Change control, and cards
  for steps 2 to 5 sit below with no controls on them; click Change, and step 1 is editable again.
  Verifies **AC-14**, **AC-15**
- Both modes and the keyboard: repeat the step 1 flow in light and dark, and no raw colour shows and
  the palette is the theme's; tab to the dropzone and the focus ring is visible without a pointer.
  Verifies **AC-16**, **AC-17**, **AC-18**, **AC-19**
- Regression guard: `pnpm build` passes with `/generate` static, no new lint finding sits in a file
  this slice owns, and `pnpm test` passes. Verifies **AC-20**, **AC-21**

## Build plan

The project builds by Tracer Bullet: a thin slice proved end to end before the next one thickens it.
For this feature that means two things. The first task is the riskiest assumption in the whole spec,
proved on its own with throwaway code: whether Turbopack emits the worker asset from that `new URL`
against a bare package specifier. If it does not, the fallback is known and cheap. If it does and
nobody checked, the failure lands after the card is finished. After that, the thinnest end to end
path gets stood up with the image path only, so if the client boundary or the state shape is wrong it
is wrong with two files rather than with a finished card. The PDF path follows, because it is the
part that can fail in ways the image path cannot.

- [x] 1. Install `pdfjs-dist` at exactly `6.3.289`, confirm `node -v` is 22.13 or newer (the package
      declares that as its engine floor, and an older Node only warns), and confirm
      `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` exists. Then spike the worker recipe on its
      own: a throwaway module that sets `workerSrc` from
      `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`, reached through one dynamic
      `import()` from one click, and check the network panel for a single worker request returning
      200 as JavaScript. Delete the spike afterwards. No package manager override, since nothing else
      in the tree depends on it. If the spike fails, stop and switch to copying the worker into
      `public/`, then record which one shipped in this spec's Follow-up. Satisfies **AC-11**,
      **AC-12**, **AC-13**
- [x] 2. Thin slice. `lib/templateUtils.ts` with `TemplateImage`, `MAX_EMBED_SIDE_PX = 3508`, the two
      pure functions `resolveCapSize` (rounding) and `resolvePdfScale`, `isPdfFile`, and
      `getImageTemplate` with its `FileReader` and `Image` helpers. `components/step-template.tsx` as
      a presentational card holding only the `label` wrapped input, the dropzone, the busy line and
      the alert path. The page owns all five pieces of state, the token ref, and a pick handler that
      bumps the token, sets busy, clears and alerts on failure, and only writes when the token is
      still current. Prove a PNG end to end on the real app. Satisfies **AC-1**, **AC-2**,
      **AC-4**, **AC-6**, **AC-7**, **AC-10**
- [x] 3. Prove the thin slice in a production build before adding anything: `/generate` still
      prerenders as `(Static)`, and the first load of the route does not fetch `pdfjs-dist`.
      Satisfies **AC-11**, **AC-13**
- [x] 4. Add the PDF path: `lib/pdfClient.ts` as the browser only module holding `getPdfTemplate`,
      dynamically imported from inside the pick handler's `try`. `file.arrayBuffer()` into
      `getDocument({ data })`, page one only, `resolvePdfScale`, `Math.ceil` the canvas,
      `page.render({ canvasContext, viewport, canvas })`, JPEG at 0.95, `finally { loadingTask
      .destroy() }`, and the `data:image/` guard on the export. Prove a PDF end to end against the
      reference app's own output. Satisfies **AC-3**, **AC-12**, **AC-13**
- [x] 5. Add the Continue control with the reference's verbatim label, the collapsed summary row with
      the `Change` control, and the inert cards for steps 2 to 5 carrying the scope's own names and
      feature numbers. Satisfies **AC-1**, **AC-14**, **AC-15**
- [x] 6. Add the thumbnail under the dropzone: `max-h-64` with `object-contain`, alternative text
      naming the file, and the `templateDataUrl` prop as its source. Satisfies **AC-5**
- [x] 7. Add the drop handlers on the label, keeping the `accept` list, taking the first file when
      several arrive, no op when none arrive, an enter and leave depth counter driving a
      `data-dragging` attribute, and the input's value reset to empty after `files[0]` has been
      captured. Satisfies **AC-8**, **AC-9**
- [x] 8. Finish the card's states: the active and collapsed border, background and shadow on theme
      tokens, `sr-only` plus `peer` on the input with the focus ring on the label, `aria-disabled`
      and `pointer-events-none` on the label while busy, the `aria-live="polite"` region around the
      busy line, and lucide `FileText` and `Upload` in place of the two emoji. No raw colour anywhere.
      Satisfies **AC-6**, **AC-16**, **AC-17**, **AC-18**, **AC-19**
- [x] 9. Unit test `isPdfFile`, `resolveCapSize` and `resolvePdfScale` for real, and the card's
      failure, retry and overlapping pick paths with `Image`, `FileReader` and canvas stubbed,
      asserting the alert through `vi.spyOn(window, "alert")` and its exact string once. No native
      canvas package. Satisfies **AC-20**
- [x] 10. Run `pnpm build`, `pnpm lint` and `pnpm test`. Confirm `/generate` is still static, the
      worker request is a single 200, and no lint finding sits in a file this slice owns.
      Satisfies **AC-21**

## Consequences

**Positive**:
- The flow has a real first step, and `/generate` is no longer the placeholder from spec 0003.
- The client boundary question is answered once, by placement, so slices 5, 7 and 8 have a pattern
  to copy instead of a decision to make.
- `/generate` loads without the PDF library, so a visitor on a slow connection can use step 1
  immediately.
- The riskiest assumption in the spec is proved before anything depends on it, and its fallback is
  written down rather than improvised.
- The worker, if the spike passes, can never be the wrong build for the installed library.
- Someone who drops a file gets what the copy promised, someone whose file fails is told in one
  sentence and can try the same file again, and someone using a keyboard can reach the dropzone at
  all, which the reference never allowed.
- The cap, the 300 DPI target, the rounding and the JPEG quality are carried over exactly, so for the
  same file in the same browser the dimensions, aspect ratio, cap and page one choice are the
  reference's.

**Negative / tradeoffs**:
- Six departures from the reference's step 1, by the engineer's choice: a thumbnail, real drop
  handling, a busy state, an input reset, a pick token, and inert cards for the steps that do not
  exist. A verification step against the reference has to treat those six as expected differences and
  everything else as a defect. That is a real cost of this slice's design and it is not free.
- The inert cards are the weakest of the six, and they are a departure rather than a parity fix. The
  reference does render later steps at position 2, but it renders the real step 2 form plus collapsed
  summaries of work already done. Anyone comparing the two screens side by side will see a
  difference, and that difference has to be defended every time the port is checked.
- The thumbnail renders an image the flow renders again at step 4, and it is held in memory for as
  long as the template is.
- The peak memory is higher than the data URL alone suggests: the data URL string, the decoded bitmap
  and the canvas are all alive at once during a load, and `toDataURL` on a 3508 pixel canvas blocks
  the main thread while it encodes.
- The first PDF upload waits on a network round trip for the library, so a first time visitor sees
  the busy line for a moment where the reference saw nothing at all.
- The dynamic import splits the reference's one module into two, and the split is load bearing: the
  browser only module must never be imported from anywhere but an event handler, and never imported
  for real by a test. A future simplification that hoists that import reintroduces the server
  rendering failure the split avoids.
- Busy state, a token ref and a stale result guard are three things the reference does not have, in a
  component whose whole job is a file input.
- Holding the state on the page rather than in the step means the props grow as slices 5 to 8 land,
  and by slice 8 the page will pass a dozen props down. The alternative, lifting state later, costs
  more.
- Nothing clears the template until the start over control arrives with scope feature 8, so until then
  a reload is the only way to drop a template. The reference has the same gap.
- Inert cards for steps 2 to 5 are display copy that has to be edited as each slice lands, and the
  landing page's step row from spec 0003 is now naming screens that exist without linking to them.

**Neutral**:
- One new dependency, pinned to the version the reference resolves to, with no override.
- No file in `app/globals.css` changes, and no token is added.
- No new environment variable, no credential, and no third party account.
- `/generate` stays statically prerendered, because the library import lives inside an event
  handler.
- Both scale calculations are expressed as pure functions, so slices 5 to 8 can reason about the
  same numbers and test them without a canvas.
- The three Agent Skills this slice installed (`react-pdf-kit-worker-config`,
  `react-pdf-kit-nextjs-app-router` and `vitest`) are project local additions that `/state-sync`
  still has to record.

## Follow-up

- [ ] Three Agent Skills were installed during this design and root `AGENTS.md` has no bullet for
      any of them: `react-pdf-kit-worker-config` and `react-pdf-kit-nextjs-app-router` govern the
      pdfjs worker and client boundary question that slices 5, 7 and 8 will each hit again, and
      `vitest` governs the test contract this repo already sets in `vitest.config.mts` and
      `vitest.setup.ts`. All three are project wide rather than area specific, so they belong at
      root. `/state-sync` owns writing them.
- [ ] The `skills` CLI installs a whole package rather than the single skill asked for: it brought in
      eight `react-pdf-kit` skills and six were removed by hand. Worth knowing before anyone runs
      `skills add` again, and worth checking that `package.json` was not touched.
- [ ] `TemplateImage.format` is produced by this slice and consumed by nothing in it, because the
      reference also ignores it: `App.tsx` hardcodes `'PNG'` in its `addImage` call. Slice 4 has to
      decide whether to pass `format` through or keep the reference's hardcoded value, and that is
      the first real test of the JPEG at 0.95 this slice produces.
- [ ] A WebP or HEIC file loads and is labelled `PNG`, because only `image/jpeg` is treated as JPEG.
      That is the reference's behaviour, kept on purpose. If a real user hits it, gating on the
      declared type is the fix and it is a five line change in `getImageTemplate`.
- [ ] A 3508 pixel PNG as a data URL can be tens of megabytes of string, and slice 4 holds hundreds
      of generated PDFs in memory at the same time. Converting image templates to JPEG would cut
      that hard, and it is not done here because it drops transparency and departs from the
      reference. If slice 4's memory ceiling bites, this is the first lever to pull.
- [ ] No `app/error.tsx` and no `app/global-error.tsx` yet, so a render error anywhere in the flow
      hits the framework's own error page, which ignores the chosen colour exactly as the unknown path
      page did before spec 0003 fixed it. Still deferred, and now closer to mattering, because this
      slice adds the first real browser only dependency to the route.
- [ ] The step 1 copy and the inert card copy are drafted here, not engineering input. Correct
      anything that reads wrong; only the six verbatim strings are load bearing.
