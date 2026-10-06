import { describe, expect, it } from "vitest";

import {
  canvasToTemplateDataUrl,
  isPdfFile,
  MAX_EMBED_SIDE_PX,
  resolveCapSize,
  resolvePdfScale,
} from "@/lib/templateUtils";

const file = (name: string, type: string) => new File(["x"], name, { type });

describe("isPdfFile (AC-2, AC-3)", () => {
  it("treats a PDF by its MIME type", () => {
    expect(isPdfFile(file("cert.pdf", "application/pdf"))).toBe(true);
  });

  it("treats a PDF by its name when the MIME type is missing or wrong", () => {
    expect(isPdfFile(file("cert.PDF", ""))).toBe(true);
    expect(isPdfFile(file("cert.pdf", "application/octet-stream"))).toBe(true);
  });

  it("rejects the image formats", () => {
    expect(isPdfFile(file("cert.png", "image/png"))).toBe(false);
    expect(isPdfFile(file("cert.jpg", "image/jpeg"))).toBe(false);
    // A WebP loads fine in the browser, so it takes the image path, as in the
    // reference app. Only image/jpeg is treated as JPEG downstream.
    expect(isPdfFile(file("cert.webp", "image/webp"))).toBe(false);
  });
});

describe("resolveCapSize (AC-4)", () => {
  it("returns null when the image already fits the cap", () => {
    expect(resolveCapSize(2970, 2100)).toBeNull();
    expect(resolveCapSize(MAX_EMBED_SIDE_PX, 1000)).toBeNull();
  });

  it("brings the longest side to exactly the cap and keeps the aspect ratio", () => {
    const capped = resolveCapSize(6000, 4000);
    if (!capped)
      throw new Error("6000x4000 is over the cap and must downscale");

    expect(capped.width).toBe(MAX_EMBED_SIDE_PX);
    expect(capped.height).toBe(Math.round((4000 / 6000) * MAX_EMBED_SIDE_PX));
    expect(capped.width / capped.height).toBeCloseTo(6000 / 4000, 2);
  });

  it("caps a portrait image on its height", () => {
    const capped = resolveCapSize(2000, 5000);
    if (!capped)
      throw new Error("2000x5000 is over the cap and must downscale");

    expect(capped.height).toBe(MAX_EMBED_SIDE_PX);
    expect(capped.width).toBe(Math.round((2000 / 5000) * MAX_EMBED_SIDE_PX));
  });
});

describe("resolvePdfScale (AC-3)", () => {
  it("never exceeds the requested DPI, which is what an A4 page needs", () => {
    // A4 landscape at scale 1 is 841.89 x 595.28 points. 300 DPI is 300/72.
    expect(resolvePdfScale(841.89, 595.28)).toBeCloseTo(300 / 72, 6);
  });

  it("falls back to the memory cap on a page large enough to exceed it", () => {
    // A 5000 point wide page at 300 DPI would be 20833 pixels on the long side.
    expect(resolvePdfScale(5000, 3500)).toBeCloseTo(
      MAX_EMBED_SIDE_PX / 5000,
      6,
    );
  });

  it("honours a lower target DPI", () => {
    expect(resolvePdfScale(841.89, 595.28, 150)).toBeCloseTo(150 / 72, 6);
  });
});

describe("canvasToTemplateDataUrl (AC-7)", () => {
  const canvasReturning = (value: string) =>
    ({ toDataURL: () => value }) as unknown as HTMLCanvasElement;

  it("returns a real image data URL", () => {
    const dataUrl = "data:image/png;base64,AAAA";

    expect(
      canvasToTemplateDataUrl(canvasReturning(dataUrl), "image/png", 0.95),
    ).toBe(dataUrl);
  });

  it("throws when the encode produced no image, rather than storing it", () => {
    // Safari answers a bare "data:," once a canvas passes its size limits. Storing
    // that would poison every later step that reads the template.
    expect(() =>
      canvasToTemplateDataUrl(canvasReturning("data:,"), "image/png", 0.95),
    ).toThrow(/could not be encoded/i);
  });
});
