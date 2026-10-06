// Browser only module. It is reached through one dynamic import from inside the
// upload handler in app/(site)/generate/page.tsx, which is what keeps pdfjs-dist
// out of the first load of the route, out of the server bundle, and out of
// prerendering. Do not import it from anywhere else.
//
// workerSrc points into the installed package rather than at a copy in the
// repository, so the worker can never be a different build than the library that
// loads it. Turbopack emits the file as a hashed asset and rewrites this URL;
// verified in a production build, where it serves as application/javascript.
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

import {
  canvasToTemplateDataUrl,
  resolvePdfScale,
  type TemplateImage,
} from "@/lib/templateUtils";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export const getPdfTemplate = async (
  file: File,
  targetDpi = 300,
): Promise<TemplateImage> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  try {
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = resolvePdfScale(
      baseViewport.width,
      baseViewport.height,
      targetDpi,
    );
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    return {
      dataUrl: canvasToTemplateDataUrl(canvas, "image/jpeg", 0.95),
      width: canvas.width,
      height: canvas.height,
      format: "JPEG",
    };
  } finally {
    await loadingTask.destroy();
  }
};
