# Verify: Preview and Generate · spec 0007 · updated 2026-10-06

_Steps derived from spec 0007 acceptance criteria. `/verify-release` runs these; `/test-engineer` locks the durable ones._

## UI / manual

- [ ] Navigate to `/generate`, upload a PNG template → Step 1 shows preview with dimensions → AC-1, AC-2
- [ ] Upload a CSV names file → Step 2 shows recipient count → AC-3 (prereq)
- [ ] Continue to Step 3, set position/size/colour → Step 3 shows controls → AC-1, AC-3 (prereq)
- [ ] Continue to Step 4 (Preview) → live preview shows first recipient's formatted name on template at configured position with selected font family, size, colour → AC-1
- [ ] Change font family radio (Times / Helvetica / Courier) → preview updates font stack → AC-9
- [ ] Click "Generate All N Certificates" → progress bar appears and increments → AC-4
- [ ] Generation completes → advances to Step 5, generated PDFs held in memory → AC-6
- [ ] Generated PDF names follow `Certificate_<sanitizedName>.pdf` pattern → AC-7
- [ ] No template uploaded, generate → PDF has Veni green border (#4faf83) → AC-8
- [ ] Click Cancel during generation → aborts, resets state, stays on Step 4 → AC-5 (cancellation)
- [ ] Large batch (>150MB estimated) → confirmation dialog appears → AC-5 (OOM heuristic)

## Commands

- [ ] `pnpm build` → compiles and typechecks successfully → all ACs
- [ ] `pnpm test` → 142 tests pass → all ACs
- [ ] `pnpm lint` → no errors in new code (only pre-existing shadcn issues) → all ACs

## Acceptance-criteria coverage

- AC-1: preview matches generated output for position, font, size, colour → met (StepPreview + generateAllPdfs use same values)
- AC-2: page size/orientation from template aspect ratio, 297mm long edge → met (getPageSize)
- AC-3: generate one PDF per recipient with template bg and formatted name → met (generateAllPdfs loop)
- AC-4: progress bar increments, 20ms yield per PDF → met (handleGenerate loop)
- AC-5: memory alert exact string, OOM heuristic, cancellation → met (MEMORY_ALERT_MESSAGE, estimateGenerationMemory, AbortController)
- AC-6: advance to Step 5, store PDFs for download → met (setGeneratedPdfs, setStep(5))
- AC-7: PDF naming Certificate_<sanitizedName>.pdf → met (sanitizeFileName)
- AC-8: fallback Veni green border when no template → met (hardcoded #4faf83 in generateAllPdfs)
- AC-9: font family selector with 3 options, preview renders matching CSS stack → met (StepPreview RadioGroup + FONT_STACKS)