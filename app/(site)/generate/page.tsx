"use client";

import { useCallback, useRef, useState } from "react";

import { StepNames } from "@/components/step-names";
import { StepTemplate } from "@/components/step-template";
import {
  DEFAULT_COLUMNS,
  DEFAULT_NAME_COLUMN,
  DEMO_RECIPIENTS,
  DOCX_FAILED_MESSAGE,
  isDocxFile,
  parseNamesText,
  type Recipient,
} from "@/lib/namesUtils";
import {
  getImageTemplate,
  isPdfFile,
  type TemplateImage,
} from "@/lib/templateUtils";

const LOAD_FAILED_MESSAGE =
  "Sorry, this template could not be loaded. Please try a different file.";

// Step N is scope feature N+3 in docs/scope/scope.md. The names are the scope's
// own, not invented here, and the cards are deliberately inert: those features
// have not been built yet and this slice must not pretend otherwise.
const UPCOMING_STEPS = [
  { step: 3, name: "Position and name formatting", feature: 6 },
  { step: 4, name: "Preview and generate", feature: 7 },
  { step: 5, name: "Download the batch", feature: 8 },
];

interface TemplateSize {
  width: number;
  height: number;
}

export default function GeneratePage() {
  const [step, setStep] = useState(1);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateDataUrl, setTemplateDataUrl] = useState("");
  const [templateDims, setTemplateDims] = useState<TemplateSize | null>(null);
  const [isTemplateBusy, setIsTemplateBusy] = useState(false);

  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>(DEMO_RECIPIENTS);
  // The parsed columns and the chosen name column. The reference holds both next
  // to the recipients, and step 3's name column picker reads them, but that step
  // is feature 6 and has not been built, so nothing here reads them yet. The
  // values are still set from every parse so the parse result is not lost when
  // the file is dropped, which is the only chance to read it.
  /* biome-ignore lint/correctness/noUnusedVariables: read by step 3, feature 6 */
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  /* biome-ignore lint/correctness/noUnusedVariables: read by step 3, feature 6 */
  const [nameColumn, setNameColumn] = useState(DEFAULT_NAME_COLUMN);
  const [isNamesBusy, setIsNamesBusy] = useState(false);

  // Bumped as the first action of every pick. Only the current token may write
  // state, clear the busy flag or alert, so a slow superseded read lands on
  // nothing rather than overwriting a newer template or raising a second alert.
  const pickToken = useRef(0);
  const namesToken = useRef(0);

  const handleTemplatePick = useCallback(async (file: File) => {
    const token = pickToken.current + 1;
    pickToken.current = token;
    const isCurrent = () => token === pickToken.current;

    setIsTemplateBusy(true);
    try {
      const template: TemplateImage = isPdfFile(file)
        ? await (await import("@/lib/pdfClient")).getPdfTemplate(file)
        : await getImageTemplate(file);

      if (!isCurrent()) return;
      setTemplateFile(file);
      setTemplateDataUrl(template.dataUrl);
      setTemplateDims({ width: template.width, height: template.height });
    } catch {
      if (!isCurrent()) return;
      setTemplateFile(null);
      setTemplateDataUrl("");
      setTemplateDims(null);
      alert(LOAD_FAILED_MESSAGE);
    } finally {
      if (isCurrent()) setIsTemplateBusy(false);
    }
  }, []);

  const handleNamesPick = useCallback(async (file: File) => {
    const token = namesToken.current + 1;
    namesToken.current = token;
    const isCurrent = () => token === namesToken.current;

    setIsNamesBusy(true);
    // Set before the read, the way the reference does: it names the picked file
    // the moment the pick is accepted, so an unreadable DOCX or a file that
    // parses to nothing still shows what was chosen. A newer pick overwrites this
    // synchronously, so the token guard below still keeps the latest name.
    setSpreadsheetFile(file);
    try {
      // The dynamic import sits inside the same try as the read, so a chunk
      // failure lands on the DOCX alert rather than on an unhandled rejection.
      const text = isDocxFile(file)
        ? await (await import("@/lib/docxClient")).extractDocxText(file)
        : await file.text();

      const parsed = parseNamesText(text);
      if (!isCurrent() || !parsed) return;

      // A file that parses to nothing keeps the recipients on screen, so the
      // card never jumps back to the demo list under a newly chosen file.
      if (parsed.recipients) setRecipients(parsed.recipients);
      setColumns(parsed.columns);
      setNameColumn(parsed.nameColumn);
    } catch {
      if (!isCurrent()) return;
      // The file name stays. The reference never takes it away on a failed read,
      // and clearing it here would report the pick as if it had never happened.
      alert(DOCX_FAILED_MESSAGE);
    } finally {
      if (isCurrent()) setIsNamesBusy(false);
    }
  }, []);

  return (
    <section
      id="generator-flow"
      className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-16"
    >
      {/* This route's one h1. The visible headings are the five step cards, so a
          hidden page title keeps the heading order from skipping a level. */}
      <h1 className="sr-only">Generate certificates</h1>

      <StepTemplate
        step={step}
        templateFile={templateFile}
        templateDataUrl={templateDataUrl}
        templateDims={templateDims}
        isBusy={isTemplateBusy}
        onTemplatePick={handleTemplatePick}
        onNext={() => setStep(Math.max(2, step))}
        onEdit={() => setStep(1)}
      />

      <StepNames
        step={step}
        spreadsheetFile={spreadsheetFile}
        recipientCount={recipients.length}
        isBusy={isNamesBusy}
        onNamesPick={handleNamesPick}
        onNext={() => setStep(Math.max(3, step))}
        onEdit={() => setStep(2)}
      />

      {step > 2 &&
        UPCOMING_STEPS.map(({ step: stepNumber, name, feature }) => (
          <div
            key={stepNumber}
            className="rounded-lg border border-border bg-muted p-6 lg:p-8"
          >
            <div className="mb-2 flex items-center gap-4">
              <span className="rounded-md border border-border bg-background px-3 py-1 font-mono text-sm font-bold text-muted-foreground">
                Step {stepNumber}
              </span>
              <h2 className="font-heading text-xl font-semibold text-muted-foreground">
                {name}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              This step arrives in feature {feature} of this build.
            </p>
          </div>
        ))}
    </section>
  );
}
