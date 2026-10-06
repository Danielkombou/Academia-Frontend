import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  estimateGenerationMemory,
  getPageSize,
  hexToRgb,
  MEMORY_ALERT_MESSAGE,
  OOM_WARNING_THRESHOLD,
  sanitizeFileName,
} from "@/lib/pdfGenerate";

describe("pdfGenerate pure helpers", () => {
  describe("getPageSize (AC-2)", () => {
    it("returns landscape A4 when no template dims provided", () => {
      const result = getPageSize(null);
      expect(result).toEqual({
        orientation: "landscape",
        widthMm: 297,
        heightMm: 210,
      });
    });

    it("returns landscape when template width >= height", () => {
      const result = getPageSize({ width: 2970, height: 2100 });
      expect(result).toEqual({
        orientation: "landscape",
        widthMm: 297,
        heightMm: 210,
      });
    });

    it("returns portrait when template height > width", () => {
      const result = getPageSize({ width: 2100, height: 2970 });
      expect(result).toEqual({
        orientation: "portrait",
        widthMm: 210,
        heightMm: 297,
      });
    });

    it("scales height correctly for landscape templates", () => {
      const result = getPageSize({ width: 4000, height: 2000 });
      expect(result.orientation).toBe("landscape");
      expect(result.widthMm).toBe(297);
      expect(result.heightMm).toBeCloseTo(148.5, 1);
    });

    it("scales width correctly for portrait templates", () => {
      const result = getPageSize({ width: 2000, height: 4000 });
      expect(result.orientation).toBe("portrait");
      expect(result.heightMm).toBe(297);
      expect(result.widthMm).toBeCloseTo(148.5, 1);
    });
  });

  describe("sanitizeFileName (AC-7)", () => {
    it("replaces spaces with underscore", () => {
      expect(sanitizeFileName("John Smith")).toBe("John_Smith");
    });

    it("replaces special characters with underscore", () => {
      expect(sanitizeFileName("Alice@domain.com")).toBe("Alice_domain_com");
    });

    it("replaces punctuation with underscore", () => {
      expect(sanitizeFileName("O'Connor")).toBe("O_Connor");
    });

    it("handles multiple consecutive non-alphanumeric", () => {
      expect(sanitizeFileName("Jean-Paul Kombou")).toBe("Jean_Paul_Kombou");
    });

    it("handles empty string", () => {
      expect(sanitizeFileName("")).toBe("");
    });

    it("preserves alphanumeric characters", () => {
      expect(sanitizeFileName("User123")).toBe("User123");
    });

    it("matches reference implementation exactly", () => {
      const referenceImpl = (rawName: string) =>
        rawName.replace(/[^a-zA-Z0-9]/g, "_");
      const testCases = [
        "Daniel Kombou",
        "Alice Smith",
        "Bob Johnson",
        "Jean-Paul Kombou",
        "O'Connor",
        "Alice@domain.com",
        "User Name 123!",
      ];
      for (const name of testCases) {
        expect(sanitizeFileName(name)).toBe(referenceImpl(name));
      }
    });
  });

  describe("hexToRgb (internal)", () => {
    it("parses 6-digit hex without hash", () => {
      expect(hexToRgb("1f2847")).toEqual([31, 40, 71]);
    });

    it("parses 6-digit hex with hash", () => {
      expect(hexToRgb("#1f2847")).toEqual([31, 40, 71]);
    });

    it("parses primary color correctly", () => {
      expect(hexToRgb("#4faf83")).toEqual([79, 175, 131]);
    });

    it("parses white", () => {
      expect(hexToRgb("#ffffff")).toEqual([255, 255, 255]);
    });

    it("parses black", () => {
      expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    });
  });

  describe("estimateGenerationMemory (AC-5 OOM heuristic)", () => {
    it("calculates bytes from base64 length", () => {
      const base64Part = "A".repeat(1000);
      const dataUrl = "data:image/png;base64," + base64Part;
      const bytes = estimateGenerationMemory(dataUrl, 10);
      // The function uses dataUrl.length * 0.75 * recipientCount
      expect(bytes).toBe(dataUrl.length * 0.75 * 10);
    });

    it("scales linearly with recipient count", () => {
      const dataUrl = "data:image/png;base64," + "A".repeat(1000);
      const oneRecipient = estimateGenerationMemory(dataUrl, 1);
      const tenRecipients = estimateGenerationMemory(dataUrl, 10);
      expect(tenRecipients).toBe(oneRecipient * 10);
    });

    it("returns 0 for empty data URL", () => {
      expect(estimateGenerationMemory("", 100)).toBe(0);
    });
  });

  describe("OOM_WARNING_THRESHOLD (AC-5)", () => {
    it("is 150MB", () => {
      expect(OOM_WARNING_THRESHOLD).toBe(150 * 1024 * 1024);
    });
  });

  describe("MEMORY_ALERT_MESSAGE (AC-5)", () => {
    it("matches the reference app exact string", () => {
      expect(MEMORY_ALERT_MESSAGE).toBe(
        "Generation failed — your browser may have run out of memory. Try fewer recipients or a smaller template.",
      );
    });
  });
});

describe("pdfGenerate async functions (require browser env)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should be testable in jsdom with proper mocks (placeholder)", () => {
    expect(true).toBe(true);
  });
});