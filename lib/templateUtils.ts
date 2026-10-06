export interface TemplateImage {
  dataUrl: string;
  width: number;
  height: number;
  format: "PNG" | "JPEG";
}

// Longest side cap for the embedded template (~300 DPI across a 297mm page).
// Anything larger than this adds memory pressure for zero visible gain at print size.
export const MAX_EMBED_SIDE_PX = 3508;

// A canvas export that is not an image data URL means the encode failed. Safari
// returns a bare "data:," once a canvas is past its size limits, and storing that
// would poison every later step that reads the template, so it is a failure here.
const IMAGE_DATA_PREFIX = "data:image/";

export const isPdfFile = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

export interface CapSize {
  width: number;
  height: number;
  scale: number;
}

/** The downscale an image needs to fit the cap, or null when it already fits. */
export const resolveCapSize = (
  width: number,
  height: number,
): CapSize | null => {
  const longest = Math.max(width, height);
  if (longest <= MAX_EMBED_SIDE_PX) return null;

  const scale = MAX_EMBED_SIDE_PX / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    scale,
  };
};

/**
 * The scale to render a PDF page at: never above the requested DPI, and never
 * above the memory cap. PDF user units are points, so 72 of them make an inch.
 */
export const resolvePdfScale = (
  baseWidth: number,
  baseHeight: number,
  targetDpi = 300,
): number =>
  Math.min(targetDpi / 72, MAX_EMBED_SIDE_PX / Math.max(baseWidth, baseHeight));

export const canvasToTemplateDataUrl = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): string => {
  const dataUrl = canvas.toDataURL(mimeType, quality);
  if (!dataUrl.startsWith(IMAGE_DATA_PREFIX)) {
    throw new Error("The template image could not be encoded.");
  }
  return dataUrl;
};

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the image template."));
    img.src = src;
  });
};

export const getImageTemplate = async (file: File): Promise<TemplateImage> => {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const isJpeg = file.type === "image/jpeg";

  const capped = resolveCapSize(img.naturalWidth, img.naturalHeight);
  if (!capped) {
    return {
      dataUrl,
      width: img.naturalWidth,
      height: img.naturalHeight,
      format: isJpeg ? "JPEG" : "PNG",
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = capped.width;
  canvas.height = capped.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // JPEG at high quality: 5-10x smaller than PNG, which keeps each generated
  // PDF small enough that hundreds of certificates fit comfortably in memory.
  return {
    dataUrl: canvasToTemplateDataUrl(
      canvas,
      isJpeg ? "image/jpeg" : "image/png",
      0.95,
    ),
    width: canvas.width,
    height: canvas.height,
    format: isJpeg ? "JPEG" : "PNG",
  };
};
