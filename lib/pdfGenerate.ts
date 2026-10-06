// Browser only module. Dynamic import keeps jspdf and pdfjs-dist out of the
// first load, the server bundle, and prerendering.
import type { TemplateImage } from "@/lib/templateUtils";
import type { Recipient, NameFormatOptions } from "@/lib/namesUtils";

export interface PageSize {
  orientation: "landscape" | "portrait";
  widthMm: number;
  heightMm: number;
}

export interface GeneratedPdf {
  name: string;
  blob: Blob;
}

export interface GenerateParams {
  recipients: Recipient[];
  nameColumn: string;
  nameFormatOpts: NameFormatOptions;
  templateDataUrl: string;
  templateFormat: "PNG" | "JPEG";
  templateDims: { width: number; height: number } | null;
  textPositions: { name: { x: number; y: number; fontSize: number } };
  nameColor: string;
  fontFamily: "times" | "helvetica" | "courier";
  signal?: AbortSignal;
}

export interface GenerateResult {
  pdfs: GeneratedPdf[];
  progress: number;
}

/**
 * Page size from template aspect ratio with 297mm long edge.
 * Matches the reference app's getPageSize().
 */
export const getPageSize = (
  templateDims: { width: number; height: number } | null,
): PageSize => {
  if (templateDims) {
    const aspect = templateDims.width / templateDims.height;
    if (aspect >= 1) {
      return { orientation: "landscape", widthMm: 297, heightMm: 297 / aspect };
    }
    return { orientation: "portrait", widthMm: 297 * aspect, heightMm: 297 };
  }
  return { orientation: "landscape", widthMm: 297, heightMm: 210 };
};

/**
 * Sanitize filename: replace non-alphanumeric with underscore.
 * Matches the reference app.
 */
export const sanitizeFileName = (rawName: string): string =>
  rawName.replace(/[^a-zA-Z0-9]/g, "_");

/**
 * Convert CSS hex color (#rrggbb) to RGB tuple for jsPDF.
 */
export const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.startsWith("#") ? hex.slice(1) : hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
};

/**
 * Map font family to jsPDF built-in font name.
 */
const fontFamilyToPdfFont = (
  fontFamily: "times" | "helvetica" | "courier",
): string => fontFamily;

/**
 * Infer image format from data URL for jsPDF addImage.
 */
const getImageFormat = (dataUrl: string): "PNG" | "JPEG" => {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  return "JPEG";
};

/**
 * Render a PDF template (data URL) to a PNG data URL using pdfjs-dist.
 * Reuses the worker setup from pdfClient.ts.
 */
export const renderPdfTemplateToDataUrl = async (
  dataUrl: string,
): Promise<string> => {
  const { GlobalWorkerOptions, getDocument } = await import("pdfjs-dist");

  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const response = await fetch(dataUrl);
  const arrayBuffer = await response.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  try {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 300 / 72 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    return canvas.toDataURL("image/png");
  } finally {
    await loadingTask.destroy();
  }
};

/**
 * Convert CSS font size (px) to jsPDF points.
 * 1 px = 72/96 pt at 96 DPI.
 */
const pxToPt = (px: number): number => px * (72 / 96);

/**
 * Compute text Y position in mm for vertical centering.
 * Text box center at (x%, y%), with cap height offset.
 */
const computeTextYMm = (
  yPct: number,
  pageHeightMm: number,
  fontSizePt: number,
): number => {
  const yCenterMm = (yPct / 100) * pageHeightMm;
  const capHeightOffsetMm = (fontSizePt * 0.35 * 25.4) / 72;
  return yCenterMm - capHeightOffsetMm;
};

/**
 * Async generator that yields one PDF per recipient.
 * Yields progress after each PDF (20ms setTimeout for GC/repaint).
 * Respects AbortSignal for cancellation.
 */
export const generateAllPdfs = async function* (
  params: GenerateParams,
): AsyncGenerator<GenerateResult, void, unknown> {
  const {
    recipients,
    nameColumn,
    nameFormatOpts,
    templateDataUrl,
    templateFormat,
    templateDims,
    textPositions,
    nameColor,
    fontFamily,
    signal,
  } = params;

  if (recipients.length === 0) return;

  const {
    orientation,
    widthMm: pageWidth,
    heightMm: pageHeight,
  } = getPageSize(templateDims);
  const fontSizePt = pxToPt(textPositions.name.fontSize);
  const [r, g, b] = hexToRgb(nameColor);
  const pdfFont = fontFamilyToPdfFont(fontFamily);
  const imageFormat = getImageFormat(templateDataUrl);
  const templateIsPdf = templateDataUrl.startsWith("data:application/pdf");

  const templateImageDataUrl = templateIsPdf
    ? await renderPdfTemplateToDataUrl(templateDataUrl)
    : templateDataUrl;

  if (signal?.aborted) return;

  const pdfs: GeneratedPdf[] = [];

  for (let i = 0; i < recipients.length; i++) {
    if (signal?.aborted) break;

    const recipient = recipients[i];
    const rawName = recipient[nameColumn] || recipient.name || "Recipient";
    const nameVal = (await import("@/lib/nameFormat")).formatCertificateName(
      rawName,
      nameFormatOpts,
    );

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({
      orientation,
      unit: "mm",
      format: [pageWidth, pageHeight],
    });

    if (templateImageDataUrl) {
      try {
        doc.addImage(
          templateImageDataUrl,
          imageFormat,
          0,
          0,
          pageWidth,
          pageHeight,
        );
      } catch {
        // Fallback: Veni green border rectangle
        doc.setLineWidth(1.5);
        doc.setDrawColor(79, 175, 131);
        doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
      }
    } else {
      // Fallback: Veni green border rectangle
      doc.setLineWidth(1.5);
      doc.setDrawColor(79, 175, 131);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    }

    doc.setTextColor(r, g, b);
    doc.setFont(pdfFont, "bold");
    doc.setFontSize(fontSizePt);

    const nameX = (textPositions.name.x / 100) * pageWidth;
    const nameY = computeTextYMm(textPositions.name.y, pageHeight, fontSizePt);

    doc.text(nameVal, nameX, nameY, { align: "center" });

    const sanitizedName = sanitizeFileName(rawName);
    const blob = (doc as any).output("blob", {
      type: "application/pdf",
    }) as Blob;
    pdfs.push({
      name: `Certificate_${sanitizedName}.pdf`,
      blob,
    });

    yield {
      pdfs: [...pdfs],
      progress: Math.round(((i + 1) / recipients.length) * 100),
    };

    await new Promise((r) => setTimeout(r, 20));
  }
};

/**
 * OOM heuristic: estimate memory pressure before generation.
 * templateDataUrl is base64, so size ≈ length * 0.75 bytes.
 * Warn if estimated > 150MB.
 */
export const estimateGenerationMemory = (
  templateDataUrl: string,
  recipientCount: number,
): number => {
  const templateBytes = templateDataUrl.length * 0.75;
  return templateBytes * recipientCount;
};

export const OOM_WARNING_THRESHOLD = 150 * 1024 * 1024; // 150MB

export const MEMORY_ALERT_MESSAGE: string =
  "Generation failed — your browser may have run out of memory. Try fewer recipients or a smaller template.";
