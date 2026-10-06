import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import GeneratePage from "@/app/(site)/generate/page";
import type { TemplateImage } from "@/lib/templateUtils";

// The real docxClient module is never imported here. The page reaches it through
// one dynamic import, and this mock stands in for it, so the mammoth bundle is
// never loaded in a test run.
vi.mock("@/lib/docxClient", () => ({ extractDocxText: vi.fn() }));

// The image path is stubbed so reaching step 2 needs no canvas, no Image and no
// FileReader. Only the step 1 behaviour this file does not cover is stubbed.
const getImageTemplate = vi.fn<() => Promise<TemplateImage>>();
vi.mock("@/lib/templateUtils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/templateUtils")>()),
  getImageTemplate: (...args: Parameters<typeof getImageTemplate>) =>
    getImageTemplate(...args),
}));

// Same reason: a PDF would reach pdfjs and wire its worker.
vi.mock("@/lib/pdfClient", () => ({ getPdfTemplate: vi.fn() }));

const { extractDocxText } = await import("@/lib/docxClient");

let alertSpy: ReturnType<typeof vi.spyOn>;

const DOCX_FAILED =
  "Could not read the .docx file. Please make sure it is a valid Word document.";

const template = (width: number, height: number): TemplateImage =>
  ({
    dataUrl: `data:image/png;base64,${width}x${height}`,
    width,
    height,
  }) as unknown as TemplateImage;

const templateInput = () =>
  screen.getByLabelText(
    /drop your png \/ jpg \/ pdf template here/i,
  ) as HTMLInputElement;

const namesInput = () =>
  screen.queryByLabelText(
    /drop your names list here/i,
  ) as HTMLInputElement | null;

/** A names file carrying text. File.text() in jsdom reads this as UTF-8. */
const namesFile = (name: string, text: string) => new File([text], name);

const pickTemplate = async () => {
  getImageTemplate.mockResolvedValue(template(2970, 2100));
  fireEvent.change(templateInput(), {
    target: { files: [new File(["x"], "cert.png", { type: "image/png" })] },
  });
  await screen.findByText("Selected: cert.png");
  fireEvent.click(screen.getByRole("button", { name: /continue to step 2/i }));
};

const pickNames = (file: File) =>
  fireEvent.change(namesInput() as HTMLInputElement, {
    target: { files: [file] },
  });

const count = () => screen.getByText(/^\d+ names loaded$/).textContent;
const continueButton = () =>
  screen.queryByRole("button", { name: /continue to step 3/i });

// Step 1's card collapses to a summary before step 2 opens, and the collapsed
// form has no live region, so by the time step 2 is up this is the only one left.
// Both cards keep their region in the DOM and always empty when idle, which is
// what lets the change be announced, so it is found by the region rather than by
// its text.
const namesLiveRegion = () => document.querySelector("[aria-live='polite']");

beforeEach(() => {
  getImageTemplate.mockReset();
  vi.mocked(extractDocxText).mockReset();
  alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("step 2 card wiring", () => {
  it("is hidden until step 1 is continued past", async () => {
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);

    expect(namesInput()).toBeNull();

    await pickTemplate();

    expect(namesInput()).toBeInTheDocument();
    expect(continueButton()).toBeInTheDocument();
  });

  it("offers exactly the three file types the reference offers", async () => {
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);
    await pickTemplate();

    expect(namesInput()).toHaveAttribute("accept", ".csv,.txt,.docx");
  });

  it("starts on the three demo recipients the reference ships with", async () => {
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);
    await pickTemplate();

    expect(count()).toBe("3 names loaded");
  });
});

describe("step 2 plain list", () => {
  it("shows the file name and the recipient count", async () => {
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);
    await pickTemplate();

    pickNames(namesFile("names.txt", "Alice Smith\nBob Johnson"));

    expect(await screen.findByText("Selected: names.txt")).toBeInTheDocument();
    expect(count()).toBe("2 names loaded");
  });

  it("empties the input after every pick, so the same file can be picked twice", async () => {
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);
    await pickTemplate();

    pickNames(namesFile("empty.txt", ""));
    await waitFor(() => expect(namesInput()).toBeEnabled());

    pickNames(namesFile("empty.txt", ""));

    // The same file twice must be read twice, not ignored the second time.
    await waitFor(() => expect(namesInput()?.value).toBe(""));
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("names an empty file and leaves the recipients alone, the way the reference does", async () => {
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);
    await pickTemplate();

    pickNames(namesFile("empty.txt", ""));

    // The reference sets the file name the moment a pick is accepted, before it
    // reads anything, so a file that parses to nothing is still named on screen
    // and the demo recipients stay put.
    expect(await screen.findByText("Selected: empty.txt")).toBeInTheDocument();
    expect(count()).toBe("3 names loaded");
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("takes a dropped file and ignores a drop carrying no files", async () => {
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);
    await pickTemplate();

    fireEvent.drop(screen.getByText(/drop your names list here/i), {
      dataTransfer: {
        files: [namesFile("dropped.csv", "Name,Email\nAlice Smith,a@b.c")],
      },
    });

    expect(
      await screen.findByText("Selected: dropped.csv"),
    ).toBeInTheDocument();
    expect(count()).toBe("1 names loaded");

    fireEvent.drop(screen.getByText(/drop your names list here/i), {
      dataTransfer: { files: [] },
    });

    await waitFor(() => expect(namesInput()).toBeEnabled());
    expect(screen.getByText("Selected: dropped.csv")).toBeInTheDocument();
  });
});

describe("step 2 DOCX", () => {
  it("routes a .docx through mammoth and parses its text", async () => {
    vi.mocked(extractDocxText).mockResolvedValue(
      "Daniel Kombou\nAlice Smith\nBob Johnson",
    );
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);
    await pickTemplate();

    pickNames(namesFile("class.docx", "not really a docx"));

    expect(await screen.findByText("Selected: class.docx")).toBeInTheDocument();
    expect(count()).toBe("3 names loaded");
    expect(extractDocxText).toHaveBeenCalledTimes(1);
  });

  it("alerts with the reference's exact string when the Word document is unreadable", async () => {
    vi.mocked(extractDocxText).mockRejectedValue(new Error("not a zip"));
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);
    await pickTemplate();

    pickNames(namesFile("broken.docx", "x"));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
    expect(alertSpy).toHaveBeenCalledWith(DOCX_FAILED);
    // The name was already on screen before the read, so the failed read leaves
    // it there. Clearing it would tell the user the file was never chosen.
    expect(screen.getByText("Selected: broken.docx")).toBeInTheDocument();
  });

  it("alerts when the mammoth chunk itself fails to load", async () => {
    vi.mocked(extractDocxText).mockRejectedValue(
      new Error("Failed to fetch dynamically imported module"),
    );
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);
    await pickTemplate();

    pickNames(namesFile("class.docx", "x"));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(DOCX_FAILED));
    expect(screen.getByText("Selected: class.docx")).toBeInTheDocument();
  });

  it("decides on the extension, so a .docx with no MIME type still takes the Word path", async () => {
    vi.mocked(extractDocxText).mockResolvedValue("Alice Smith");
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);
    await pickTemplate();

    pickNames(new File(["x"], "class.docx", { type: "" }));

    expect(await screen.findByText("Selected: class.docx")).toBeInTheDocument();
    expect(extractDocxText).toHaveBeenCalledTimes(1);
  });
});

describe("step 2 overlapping picks", () => {
  // These two use plain text files rather than DOCX on purpose. Two overlapping
  // picks have to reach the same handler, and two concurrent dynamic imports of
  // one vi.mock'ed module make the second resolve to the real module, which is a
  // vitest artifact rather than anything the app does. The token guard under test
  // lives above that branch and is identical for either file type, so a text file
  // exercises it without the artifact.
  it("keeps the most recent pick and stays silent about the abandoned one", async () => {
    let releaseFirst = () => {};
    const firstRead = new Promise<string>((resolve) => {
      releaseFirst = () => resolve("Slow One\nSlow Two");
    });
    const slowText = vi.fn(() => firstRead);
    const fastText = vi.fn(() => Promise.resolve("Alice Smith"));
    vi.spyOn(File.prototype, "text").mockImplementation(
      slowText as File["text"],
    );
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);
    await pickTemplate();

    vi.spyOn(File.prototype, "text").mockImplementation(
      fastText as File["text"],
    );
    pickNames(namesFile("slow.txt", "x"));
    pickNames(namesFile("fast.txt", "x"));

    expect(await screen.findByText("Selected: fast.txt")).toBeInTheDocument();
    expect(count()).toBe("1 names loaded");

    // The abandoned read lands afterwards and must change nothing.
    releaseFirst();

    await waitFor(() => expect(namesInput()).toBeEnabled());
    expect(screen.getByText("Selected: fast.txt")).toBeInTheDocument();
    expect(count()).toBe("1 names loaded");
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("says nothing when the abandoned pick is the one that failed", async () => {
    let failFirst = () => {};
    const firstRead = new Promise<string>((_resolve, reject) => {
      failFirst = () => reject(new Error("stale failure"));
    });
    vi.spyOn(File.prototype, "text")
      .mockImplementationOnce((() => firstRead) as File["text"])
      .mockImplementation((() =>
        Promise.resolve("Alice Smith")) as File["text"]);
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);
    await pickTemplate();

    pickNames(namesFile("slow.txt", "x"));
    pickNames(namesFile("fast.txt", "x"));

    expect(await screen.findByText("Selected: fast.txt")).toBeInTheDocument();

    failFirst();

    await waitFor(() => expect(namesInput()).toBeEnabled());
    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.getByText("Selected: fast.txt")).toBeInTheDocument();
  });
});

describe("step 2 progress and collapse", () => {
  it("disables the picker while reading and announces it in the live region", async () => {
    let release = () => {};
    vi.mocked(extractDocxText).mockReturnValue(
      new Promise<string>((resolve) => {
        release = () => resolve("Alice Smith");
      }),
    );
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);
    await pickTemplate();

    pickNames(namesFile("class.docx", "x"));

    expect(
      await screen.findByText("Reading names file..."),
    ).toBeInTheDocument();
    expect(namesLiveRegion()).toHaveTextContent("Reading names file...");
    expect(namesInput()).toBeDisabled();
    expect(continueButton()).toBeDisabled();

    release();

    expect(await screen.findByText("Selected: class.docx")).toBeInTheDocument();
    expect(namesInput()).toBeEnabled();
    expect(namesLiveRegion()).toBeEmptyDOMElement();
  });

  it("collapses to a summary naming the file and the count, and reopens on Change", async () => {
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);
    await pickTemplate();

    pickNames(
      namesFile(
        "names.csv",
        "Name,Email\nAlice Smith,a@b.c\nBob Johnson,d@e.f",
      ),
    );
    await screen.findByText("Selected: names.csv");

    fireEvent.click(
      screen.getByRole("button", { name: /continue to step 3/i }),
    );

    expect(namesInput()).toBeNull();
    expect(screen.getByText("names.csv (2 names)")).toBeInTheDocument();

    // Step 1 is collapsed too, so both cards offer Change. The second belongs to
    // step 2, and clicking it must reopen step 2 without disturbing step 1.
    const changeButtons = screen.getAllByRole("button", { name: "Change" });
    expect(changeButtons).toHaveLength(2);

    fireEvent.click(changeButtons[1]);

    expect(namesInput()).toBeInTheDocument();
    expect(screen.getByText("Selected: names.csv")).toBeInTheDocument();
    expect(count()).toBe("2 names loaded");
    expect(screen.getAllByRole("button", { name: "Change" })).toHaveLength(1);
  });
});
