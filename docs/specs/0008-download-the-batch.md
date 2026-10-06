# Download the Batch

**Status**: Proposed

**Date**: 2026-10-06

**Scope feature**: 8 (Slice 5: Download the batch)

**Code area**: `app/(site)/generate/page.tsx`, `components/step-done.tsx`, `lib/zipUtils.ts`

## Summary

Build Step 5 of the certificate generator flow: download the generated certificates as a ZIP file named `Certificates_Batch.zip` containing one `Certificate_<sanitizedName>.pdf` per recipient. Use the File System Access API (`showSaveFilePicker`) for streaming download where supported, with a JSZip blob fallback for other browsers. Also offer a single PDF download of the first certificate. A "Generate Another Batch" control resets the entire flow to step 1.

This feature installs `jszip`. The StepDone component mirrors the reference app's layout with Veni theming.

## Requirements

**AC-1** Clicking "Download ZIP Archive" downloads all generated certificates as a ZIP file named `Certificates_Batch.zip`. Each file inside is named `Certificate_<sanitizedName>.pdf` where the sanitized name replaces non-alphanumeric characters with underscore (matching the reference: `rawName.replace(/[^a-zA-Z0-9]/g, '_')`).

**AC-2** Where the browser supports `showSaveFilePicker` and is in a secure context (`window.isSecureContext`), the ZIP is streamed directly to disk using the File System Access API. The stream writes local file headers, file data, central directory entries, and end of central directory sequentially without holding the full ZIP in memory.

**AC-3** Where `showSaveFilePicker` is not supported or not in a secure context, the ZIP is created in memory using JSZip with `compression: 'STORE'` (PDFs are already compressed) and downloaded via object URL (blob download).

**AC-4** Clicking "Download Sample PDF" downloads the first generated PDF on its own with its original filename (`Certificate_<sanitizedName>.pdf`).

**AC-5** Clicking "Generate Another Batch" resets the entire flow to step 1: clears step, templateFile, templateDataUrl, templateDims, spreadsheetFile, isGenerating, generatedPdfs. Keeps demo recipients so the card is never empty.

**AC-6** Step 5 renders only when step === 5. Shows success icon, "Done!" heading, recipient count subtitle, primary "Download ZIP Archive" button, secondary "Download Sample PDF" button, and "Generate Another Batch" link.

**AC-7** If the user cancels the File System Access picker (`AbortError`), the operation aborts cleanly without error alert.

**AC-8** Object URLs created for blob downloads are revoked after the download is triggered to avoid memory leaks.

## Decision

### Stack additions

- `jszip` — ZIP creation in the browser. Chosen because the reference app uses it with STORE compression (PDFs are already compressed). Runner up: `zip.js` (more complex API, streaming-focused).

### Component design

**StepDone** (client component) renders at step 5:
- Success state card with Veni green accent border
- Success icon (checkmark circle)
- "Done!" heading
- Subtitle: "N certificates successfully generated as standalone PDFs and zipped."
- Primary button: "Download ZIP Archive" → calls `onDownloadZip`
- Secondary button: "Download Sample PDF (Certificate_<name>.pdf)" → calls `onDownloadSingle` with first PDF
- Link/button: "Generate Another Batch" → calls `onReset`

### Zip utilities (`lib/zipUtils.ts`)

Ported from reference app with Veni theming considerations:

- `supportsStreamingZip()` → checks `typeof window.showSaveFilePicker === 'function' && window.isSecureContext`
- `streamZipToDisk(entries, suggestedName)` → async function using `showSaveFilePicker`, writes ZIP structure sequentially to writable stream. Catches `AbortError` and returns silently.
- `downloadZipFallback(entries, suggestedName)` → creates JSZip with `compression: 'STORE'`, generates blob, triggers download via object URL, revokes object URL after click.
- `downloadSinglePDF(pdf)` → downloads a single PDF blob via object URL, revokes object URL after click.
- CRC32 table and helpers for ZIP structure (local header, central directory, end of central directory) — **ported verbatim from reference `zipUtils.ts`** to avoid off-by-one errors.
- `ZipEntry` type: `{ name: string; blob: Blob }`
- Sanitize regex for filenames: `rawName.replace(/[^a-zA-Z0-9]/g, '_')` (matches reference, used in Step 4 for PDF names, reused here for consistency)

### State additions (in `page.tsx`)

No new persistent state. Uses existing `generatedPdfs` from Step 4. Adds transient `isDownloading` for fallback UI. Handlers:

- `handleDownloadZip` → if `supportsStreamingZip()` calls `streamZipToDisk`, else calls `downloadZipFallback`. Sets `isDownloading` during fallback.
- `handleDownloadSingle` → calls `downloadSinglePDF(generatedPdfs[0])`
- `handleReset` → clears all flow state, sets step to 1, preserves demo recipients

### Data model

No new data model. Consumes `generatedPdfs: GeneratedPdf[]` from Step 4.

| Field | Type | Source |
|-------|------|--------|
| generatedPdfs | `GeneratedPdf[]` | Step 4 generation output |
| recipientCount | number | `generatedPdfs.length` (derived, 1:1 with recipients) |

### Value sourcing table

| Acceptance criterion | Value needed | Source |
|---------------------|--------------|--------|
| AC-1 | ZIP filename | Constant `"Certificates_Batch.zip"` |
| AC-1 | PDF filenames | `generatedPdfs.map(p => p.name)` (already sanitized in Step 4) |
| AC-2 | Streaming support | `supportsStreamingZip()` → `showSaveFilePicker` + `isSecureContext` |
| AC-2 | Writable stream | `showSaveFilePicker` handle → `createWritable()` |
| AC-2 | File picker options | `{ suggestedName: "Certificates_Batch.zip", types: [{ accept: { "application/zip": [".zip"] } }] }` |
| AC-3 | JSZip instance | `new JSZip()` with `compression: 'STORE'` |
| AC-3 | Blob download | `URL.createObjectURL(zipBlob)` → revoke after click |
| AC-4 | First PDF | `generatedPdfs[0]` |
| AC-5 | Reset state | `resetAll()` clears step, templateFile, templateDataUrl, templateDims, spreadsheetFile, isGenerating, generatedPdfs; keeps demo recipients |
| AC-6 | Recipient count | `generatedPdfs.length` (derived) |
| AC-7 | Abort handling | `streamZipToDisk` catches `AbortError` and returns |
| AC-8 | Object URL cleanup | `URL.revokeObjectURL(url)` after `a.click()` in fallback and single PDF |

### Edge cases

- Empty `generatedPdfs`: Step 5 should not render (guarded by step === 5 which only happens after generation)
- User cancels file picker: catch `AbortError`, return silently
- Streaming write fails: catch error, fall back to `downloadZipFallback` (consistent UX)
- Very large ZIP: streaming avoids memory pressure; fallback may hit memory limits for huge batches — no progress for fallback in this slice
- Single PDF download when only one certificate: both buttons work, sample PDF is the only one
- Non-secure context (HTTP): `supportsStreamingZip()` returns false, uses fallback
- Object URL leak: all blob downloads revoke URL after click
- Demo recipients: hardcoded default array preserved on reset (same as reference)

## Build plan

**Milestone 1: Zip utilities (AC-1, AC-2, AC-3, AC-7, AC-8)**
- Install `jszip`
- Create `lib/zipUtils.ts` with CRC32, ZIP structure builders, `supportsStreamingZip`, `streamZipToDisk`, `downloadZipFallback`, `downloadSinglePDF` — **port CRC32 and ZIP builders verbatim from reference `zipUtils.ts`**
- Unit test CRC32, ZIP builders, `supportsStreamingZip`, `downloadSinglePDF` URL revocation

**Milestone 2: StepDone component (AC-4, AC-5, AC-6)**
- Create `components/step-done.tsx` with Veni theming (primary border, Veni green buttons)
- Wire `onDownloadZip`, `onDownloadSingle`, `onReset` props
- Test render at step 5, not at other steps
- Add `isDownloading` prop for fallback loading state (disables buttons, shows spinner)

**Milestone 3: Page wiring (AC-1, AC-2, AC-3, AC-5, AC-7, AC-8)**
- Add `handleDownloadZip`, `handleDownloadSingle`, `handleReset` to `page.tsx`
- Add `isDownloading` state for fallback ZIP creation
- Import zipUtils functions
- Wire StepDone with handlers
- Test full flow: generate → step 5 → download ZIP (streaming + fallback) → download single → reset

**Milestone 4: Polish and verification (all ACs)**
- Keyboard access on all buttons
- Tokens only (Veni green for primary button, border)
- Build, lint, test green
- Verify against reference app on same template + names + settings

## Consequences

- `jszip` adds ~100KB to client bundle (gzipped ~30KB). Acceptable.
- Streaming download avoids holding full ZIP in memory (important for large batches). Fallback holds ZIP in memory but uses STORE compression.
- File System Access API requires secure context (HTTPS or localhost). Works in dev and production.
- Reset preserves demo recipients per reference behavior.
- No server involvement; all client-side.

## Follow-up

- Feature 9 (Full parity proof) will compare ZIP contents and filenames between both apps.
- Consider adding progress indicator for fallback ZIP creation (currently synchronous).
- Could add "Download All as Individual PDFs" as a future enhancement.

## References

- React reference app: `~/Projects/veni-react/src/components/StepDone.tsx` (Step 5 UI)
- React reference app: `~/Projects/veni-react/src/zipUtils.ts` (ZIP streaming + fallback)
- React reference app: `~/Projects/veni-react/src/App.tsx` (download handlers, resetAll)
- JSZip documentation: https://stuk.github.io/jszip/
- File System Access API: https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
- Scope: `docs/scope/scope.md` feature 8
- Spec 0007 (preview and generate) for `generatedPdfs` shape and `GeneratedPdf` type
- Spec 0006 (position and name formatting) for `sanitizeFileName` (used in Step 4 for PDF names)