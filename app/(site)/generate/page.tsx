"use client";

import { useCallback, useRef, useState } from "react";

import { StepDone } from "@/components/step-done";
import { StepNames } from "@/components/step-names";
import { StepPosition } from "@/components/step-position";
import { StepPreview } from "@/components/step-preview";
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
  downloadSinglePDF,
  downloadZipFallback,
  streamZipToDisk,
  supportsStreamingZip,
} from "@/lib/zipUtils";
import {
  estimateGenerationMemory,
  generateAllPdfs,
  MEMORY_ALERT_MESSAGE,
  OOM_WARNING_THRESHOLD,
  type GenerateParams,
  type GeneratedPdf,
} from "@/lib/pdfGenerate";
import {
  getImageTemplate,
  isPdfFile,
  type TemplateImage,
} from "@/lib/templateUtils";

const LOAD_FAILED_MESSAGE =
  "Sorry, this template could not be loaded. Please try a different file.";

interface TemplateSize {
  width: number;
  height: number;
}

interface TextPositions {
  name: { x: number; y: number; fontSize: number };
}

interface NameFormatOptions {
  fullNamesCount: number;
  abbreviationsCount: number;
}

export default function GeneratePage() {
  const [step, setStep] = useState(1);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateDataUrl, setTemplateDataUrl] = useState("");
  const [templateDims, setTemplateDims] = useState<TemplateSize | null>(null);
  const [isTemplateBusy, setIsTemplateBusy] = useState(false);

  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>(DEMO_RECIPIENTS);
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [nameColumn, setNameColumn] = useState(DEFAULT_NAME_COLUMN);
  const [isNamesBusy, setIsNamesBusy] = useState(false);

  const [textPositions, setTextPositions] = useState<TextPositions>({
    name: { x: 50, y: 53, fontSize: 36 },
  });
  const [nameFormatOpts, setNameFormatOpts] = useState<NameFormatOptions>({
    fullNamesCount: 2,
    abbreviationsCount: 999,
  });
  const [nameColor, setNameColor] = useState("#1f2847");
  const [fontFamily, setFontFamily] = useState<
    "times" | "helvetica" | "courier"
  >("times");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedPdfs, setGeneratedPdfs] = useState<GeneratedPdf[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const handleGenerate = useCallback(async () => {
    if (recipients.length === 0) return;

    const estimatedBytes = estimateGenerationMemory(
      templateDataUrl,
      recipients.length,
    );
    if (estimatedBytes > OOM_WARNING_THRESHOLD) {
      const confirmGenerate = window.confirm(
        "Large batch may exceed browser memory. Continue anyway?",
      );
      if (!confirmGenerate) return;
    }

    abortControllerRef.current = new AbortController();
    setIsGenerating(true);
    setGenerationProgress(0);
    const pdfs: GeneratedPdf[] = [];

    try {
      const params: GenerateParams = {
        recipients,
        nameColumn,
        nameFormatOpts,
        templateDataUrl,
        templateFormat: "JPEG",
        templateDims,
        textPositions,
        nameColor,
        fontFamily,
        signal: abortControllerRef.current.signal,
      };

      for await (const result of generateAllPdfs(params)) {
        setGenerationProgress(result.progress);
        pdfs.push(...result.pdfs);
      }

      if (!abortControllerRef.current?.signal.aborted) {
        setGeneratedPdfs(pdfs);
        setStep(5);
      }
    } catch {
      if (!abortControllerRef.current?.signal.aborted) {
        alert(MEMORY_ALERT_MESSAGE);
      }
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      abortControllerRef.current = null;
    }
  }, [
    recipients,
    nameColumn,
    nameFormatOpts,
    templateDataUrl,
    templateDims,
    textPositions,
    nameColor,
    fontFamily,
  ]);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setGenerationProgress(0);
    abortControllerRef.current = null;
  }, []);

  const handleDownloadZip = useCallback(async () => {
    if (generatedPdfs.length === 0) return;
    setIsDownloading(true);
    try {
      if (supportsStreamingZip()) {
        await streamZipToDisk(generatedPdfs, "Certificates_Batch.zip");
      } else {
        await downloadZipFallback(generatedPdfs, "Certificates_Batch.zip");
      }
    } catch {
      // Streaming failed, try fallback
      try {
        await downloadZipFallback(generatedPdfs, "Certificates_Batch.zip");
      } catch {
        alert("Failed to download ZIP. Please try again.");
      }
    } finally {
      setIsDownloading(false);
    }
  }, [generatedPdfs]);

  const handleDownloadSingle = useCallback(async () => {
    if (generatedPdfs.length === 0) return;
    setIsDownloading(true);
    try {
      await downloadSinglePDF(generatedPdfs[0]);
    } catch {
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [generatedPdfs]);

  const handleReset = useCallback(() => {
    setStep(1);
    setTemplateFile(null);
    setTemplateDataUrl("");
    setTemplateDims(null);
    setSpreadsheetFile(null);
    setIsGenerating(false);
    setGeneratedPdfs([]);
    setIsDownloading(false);
    // Keep demo recipients (DEMO_RECIPIENTS is the initial state)
    setRecipients(DEMO_RECIPIENTS);
    setColumns(DEFAULT_COLUMNS);
    setNameColumn(DEFAULT_NAME_COLUMN);
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

      <StepPosition
        step={step}
        columns={columns}
        nameColumn={nameColumn}
        setNameColumn={setNameColumn}
        textPositions={textPositions}
        setTextPositions={setTextPositions}
        nameFormatOpts={nameFormatOpts}
        setNameFormatOpts={setNameFormatOpts}
        nameColor={nameColor}
        setNameColor={setNameColor}
        onNext={() => setStep(Math.max(4, step))}
        onEdit={() => setStep(3)}
      />

      <StepPreview
        step={step}
        templateDataUrl={templateDataUrl}
        templateDims={templateDims}
        recipients={recipients}
        nameColumn={nameColumn}
        textPositions={textPositions}
        nameFormatOpts={nameFormatOpts}
        nameColor={nameColor}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        isGenerating={isGenerating}
        generationProgress={generationProgress}
        onGenerate={handleGenerate}
        onCancel={handleCancel}
      />

      <StepDone
        step={step}
        recipientCount={recipients.length}
        generatedPdfs={generatedPdfs}
        onDownloadZip={handleDownloadZip}
        onDownloadSingle={handleDownloadSingle}
        onReset={handleReset}
        isDownloading={isDownloading}
      />
    </section>
  );
}
