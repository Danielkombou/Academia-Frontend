# Verify: template upload · spec 0004 · updated 2026-10-06

_Steps derived from spec 0004 acceptance criteria. `/verify-release` runs these; `/test-engineer` locks the durable ones._

The worker recipe was spiked and proved before any card code existed, and the PDF path was proved in a
real browser at 3508 by 2481 with the reference app reporting the same aspect ratio of 1.41395 on the
same file. What is left here is the independent confirmation.

**Browser requirement.** `pdfjs-dist` 6.3.289 uses `Map.prototype.getOrInsertComputed`. The headless
Chrome 142 that ships with the automation tooling does not have it and fails inside the library. The
reference app fails identically there, so that is parity rather than a port defect. Use Chrome 153 or
newer for the PDF steps.

## UI / manual

- [x] Open `/generate` → the step 1 card shows `Upload Certificate Template`, the `Step 1` badge, `Drop your PNG / JPG / PDF template here or click to browse`, `Recommended landscape 2970x2100px · PDF first page is used`, and no Continue control → AC-1
- [x] Pick a PNG under the cap → `Selected: <name>`, a thumbnail at the file's own size, Continue enabled, and the input reports "No file chosen" again because its value was reset → AC-2, AC-5, AC-9
- [x] Pick a 4000 by 3000 PNG → the thumbnail and its `width`/`height` attributes read 3508 by 2631, aspect ratio unchanged → AC-4
- [x] Pick a landscape A4 PDF → a thumbnail at 3508 by 2481 with a `data:image/jpeg` source, and one worker request to `/_next/static/media/pdf.worker.min.<hash>.mjs` returning 200 as `application/javascript` → AC-3, AC-12
- [x] Same file in the reference app at `~/Projects/veni-react`, advance to its step 4 → its preview aspect ratio reads 1.41395, which is 3508 divided by 2481 → AC-3
- [x] Fresh load of `/generate`, watch the network panel → no pdfjs chunk is fetched until a PDF is attempted → AC-11
- [x] Start a large PDF, then pick or drop a second file before it finishes → the second file's template is what remains, and only one alert ever appears → AC-10
- [x] Watch a large PDF being read → the input is disabled, the dropzone cannot be clicked, the live line reads `Reading template...`, and that line sits inside an `aria-live` region → AC-6
- [x] Pick a text file renamed to `.png` → state clears, the alert reads exactly `Sorry, this template could not be loaded. Please try a different file.`, then pick the same file again and confirm it is attempted rather than ignored → AC-7, AC-9
- [x] Drag a file from the desktop onto the dropzone → it loads; drag three files → only the first is read; drag plain text → nothing at all happens → AC-8
- [x] Click Continue → step 1 collapses to the file name with a `Change` control, and four cards appear carrying `Names upload` in feature 5, `Position and name formatting` in feature 6, `Preview and generate` in feature 7 and `Download the batch` in feature 8, with no controls on them; click Change → step 1 is editable again with the template intact → AC-14, AC-15
- [x] Tab to the dropzone without touching the pointer → a 2px green ring appears around it → AC-19
- [x] Repeat the flow in light and dark → only theme colours appear, no raw colour, no emoji anywhere → AC-16, AC-17
- [x] Read the step card's markup → plain `div`, `label`, `input`, `button` and `img`, no shadcn `Card` → AC-18

## Commands

- [x] `pnpm build` → passes, and `/generate` still shows `(Static)` → AC-13, AC-21
- [x] `pnpm lint` → 62 errors, the recorded baseline, and none in `lib/`, `components/step-template.tsx` or `app/(site)/generate/` → AC-21
- [x] `pnpm test` → 107 pass → AC-20, AC-21

## Value sourcing

- [x] The thumbnail's `src` starts `data:image/png;base64`, which is `FileReader.readAsDataURL` → AC-2
- [x] The thumbnail's `width`/`height` attributes match the picked file's real size, which is `naturalWidth` and `naturalHeight` → AC-2
- [x] A JPG thumbnail's `src` starts `data:image/jpeg` and a PNG's starts `data:image/png`, which is the `file.type === "image/jpeg"` test deciding the format → AC-2, AC-4
- [ ] 4000 by 3000 gives 3508 by 2631 and 2000 by 5000 gives 1754 by 3508, which is `resolveCapSize` rounding with `Math.round` → AC-4
- [x] A downscaled JPG thumbnail's `src` starts `data:image/jpeg`, which is `toDataURL(mime, 0.95)` → AC-4
- [ ] A canvas too large to encode alerts rather than storing `data:,`, which is the `data:image/` prefix guard → AC-7
- [x] A PDF that loads proves `file.arrayBuffer` reached `getDocument` → AC-3
- [x] An A4 landscape PDF gives 3508 by 2481 because 300 DPI wins, and a very large page gives the cap instead, which is `resolvePdfScale` → AC-3
- [x] The PDF canvas is 2481 tall and not 2480, which proves `Math.ceil` → AC-3
- [x] The PDF thumbnail is not blank, which proves `page.render` received the canvas argument → AC-3
- [x] The PDF thumbnail's `src` starts `data:image/jpeg`, because a PDF always encodes as JPEG → AC-3
- [x] A multipage PDF whose second page looks different shows the first page → AC-3
- [x] Five PDFs in a row load with no leak or slowdown, which proves `loadingTask.destroy()` runs in a `finally` → AC-3
- [ ] Throttle the network until the dynamic import itself fails → the same alert still fires, because the import sits inside the pick handler's `try` → AC-7
- [x] `Selected:` and the summary row both show `templateFile.name` → AC-5
- [x] The thumbnail's `src` equals the stored data URL and is unchanged after Continue and back, which is the `templateDataUrl` prop → AC-5
- [x] The thumbnail's `alt` reads `Preview of the template <name>`, which is `templateFile.name` → AC-5
- [x] The thumbnail renders 254px tall with its width following the ratio, which is CSS `max-h-64` → AC-5
- [x] The disabled input and the live line clear exactly when the current pick settles, which is the busy flag cleared only by the current pick token → AC-6, AC-10
- [x] The alert string matches the reference character for character → AC-7
- [x] An abandoned pick that fails raises no second alert, which is the pick token comparison → AC-10
- [x] The input's `accept` attribute reads `.png,.jpg,.jpeg,.pdf`, verbatim from the reference → AC-8
- [x] The four step 1 strings match the reference exactly, character for character → AC-1
- [x] The four inert card names and feature numbers match `docs/scope/scope.md` → AC-15
- [x] The worker request path carries a hashed build filename under `/_next/static/media` rather than a hand written path, which is `new URL` against the installed package → AC-12

## Acceptance-criteria coverage

- AC-1 covered by manual step 1 and the verbatim copy step
- AC-2 covered by manual steps 2, 3 and the data URL, size and format sourcing steps
- AC-3 covered by manual steps 4, 5 and every PDF sourcing step
- AC-4 covered by manual step 3 and the cap and export sourcing steps
- AC-5 covered by manual step 2 and the thumbnail sourcing steps
- AC-6 covered by manual step 8 and the busy flag sourcing step
- AC-7 covered by manual step 9 and the guard and chunk sourcing steps
- AC-8 covered by manual step 10 and the accept list sourcing step
- AC-9 covered by manual steps 2 and 9
- AC-10 covered by manual step 7 and the stale alert sourcing step
- AC-11 covered by manual step 6
- AC-12 covered by manual step 4 and the worker URL sourcing step
- AC-13 covered by `pnpm build`
- AC-14 and AC-15 covered by manual step 11
- AC-16 and AC-17 covered by manual step 13
- AC-18 covered by manual step 14
- AC-19 covered by manual step 12
- AC-20 covered by `pnpm test`
- AC-21 covered by `pnpm build` and `pnpm lint`
