import { describe, expect, it, vi } from "vitest";

import { extractDocxText } from "@/lib/docxClient";

vi.mock("mammoth/mammoth.browser", () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

const { default: mammoth } = await import("mammoth/mammoth.browser");

describe("extractDocxText", () => {
  it("returns the extracted text on success", async () => {
    vi.mocked(mammoth.extractRawText).mockResolvedValue({
      value: "Daniel Kombou\nAlice Smith",
    });

    const file = new File(["fake docx"], "names.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const text = await extractDocxText(file);

    expect(text).toBe("Daniel Kombou\nAlice Smith");
    expect(mammoth.extractRawText).toHaveBeenCalledTimes(1);
    expect(mammoth.extractRawText).toHaveBeenCalledWith({
      arrayBuffer: expect.any(ArrayBuffer),
    });
  });

  it("throws when mammoth rejects, caller turns into the alert", async () => {
    vi.mocked(mammoth.extractRawText).mockRejectedValue(new Error("not a zip"));

    const file = new File(["x"], "broken.docx", { type: "" });

    await expect(extractDocxText(file)).rejects.toThrow("not a zip");
  });

  it("passes the file's array buffer to mammoth", async () => {
    vi.mocked(mammoth.extractRawText).mockResolvedValue({ value: "Alice" });

    const file = new File(["content"], "test.docx", { type: "" });

    await extractDocxText(file);

    const callArg = vi.mocked(mammoth.extractRawText).mock.calls[0][0];
    expect(callArg.arrayBuffer).toBeInstanceOf(ArrayBuffer);
  });
});
