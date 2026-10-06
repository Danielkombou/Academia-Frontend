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

// The real pdfClient module is never imported here. The page reaches it through
// one dynamic import, and this mock stands in for it, so the pdfjs worker is
// never wired in a test run.
vi.mock("@/lib/pdfClient", () => ({ getPdfTemplate: vi.fn() }));

const getImageTemplate = vi.fn<() => Promise<TemplateImage>>();
vi.mock("@/lib/templateUtils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/templateUtils")>()),
  getImageTemplate: (...args: Parameters<typeof getImageTemplate>) =>
    getImageTemplate(...args),
}));

const { getPdfTemplate } = await import("@/lib/pdfClient");

// jsdom does not implement alert, so every test gets a spy. The failure tests
// assert on it; the rest only need it swallowed.
let alertSpy: ReturnType<typeof vi.spyOn>;

const LOAD_FAILED =
  "Sorry, this template could not be loaded. Please try a different file.";

const template = (width: number, height: number): TemplateImage =>
  ({
    dataUrl: `data:image/png;base64,${width}x${height}`,
    width,
    height,
    height_: undefined,
  }) as unknown as TemplateImage;

const png = (name = "cert.png") => new File(["x"], name, { type: "image/png" });

const input = () =>
  screen.getByLabelText(
    /drop your png \/ jpg \/ pdf template here/i,
  ) as HTMLInputElement;

const pick = (file: File) =>
  fireEvent.change(input(), { target: { files: [file] } });

const selected = () => screen.queryByText(/^Selected: /);
const thumbnail = () => screen.queryByRole("img");
const continueButton = () =>
  screen.queryByRole("button", { name: /continue to step 2/i });
// The busy line is always in the DOM and always empty when idle, which is what
// lets the change be announced. So it is found by its live region, not its text.
const liveRegion = () => document.querySelector("[aria-live='polite']");

beforeEach(() => {
  getImageTemplate.mockReset();
  vi.mocked(getPdfTemplate).mockReset();
  alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("step 1 template upload", () => {
  it("loads a PNG and shows its name, its dimensions and the Continue control", async () => {
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);

    pick(png());

    expect(await screen.findByText("Selected: cert.png")).toBeInTheDocument();
    const preview = thumbnail();
    expect(preview).toHaveAttribute("width", "2970");
    expect(preview).toHaveAttribute("height", "2100");
    expect(preview).toHaveAttribute("alt", "Preview of the template cert.png");
    expect(continueButton()).toBeEnabled();
  });

  it("empties the input after every pick, so the same file can be picked twice", async () => {
    getImageTemplate.mockRejectedValue(new Error("nope"));
    render(<GeneratePage />);

    pick(png());

    await waitFor(() => expect(getImageTemplate).toHaveBeenCalledTimes(1));
    expect(input().value).toBe("");

    // The same failing file again must be attempted, not ignored.
    pick(png());

    await waitFor(() => expect(getImageTemplate).toHaveBeenCalledTimes(2));
  });

  it("routes a PDF through the pdfjs path, not the image path", async () => {
    vi.mocked(getPdfTemplate).mockResolvedValue(template(3508, 2480));
    render(<GeneratePage />);

    pick(new File(["x"], "cert.pdf", { type: "application/pdf" }));

    expect(await screen.findByText("Selected: cert.pdf")).toBeInTheDocument();
    expect(vi.mocked(getPdfTemplate)).toHaveBeenCalledTimes(1);
    expect(getImageTemplate).not.toHaveBeenCalled();
  });
});

describe("step 1 failure path (AC-7)", () => {
  it("clears the state and alerts with the reference's exact string", async () => {
    getImageTemplate.mockRejectedValue(new Error("decode failed"));
    render(<GeneratePage />);

    pick(png("broken.png"));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
    expect(alertSpy).toHaveBeenCalledWith(LOAD_FAILED);
    expect(selected()).toBeNull();
    expect(thumbnail()).toBeNull();
    expect(continueButton()).toBeNull();
  });

  it("leaves the card idle after a failure, not stuck busy", async () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    getImageTemplate.mockRejectedValue(new Error("decode failed"));
    render(<GeneratePage />);

    pick(png());

    await waitFor(() => expect(input()).toBeEnabled());
    expect(liveRegion()).toBeEmptyDOMElement();
  });

  it("alerts when the pdfjs chunk itself fails to load", async () => {
    vi.mocked(getPdfTemplate).mockRejectedValue(
      new Error("Failed to fetch dynamically imported module"),
    );
    render(<GeneratePage />);

    pick(new File(["x"], "cert.pdf", { type: "application/pdf" }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(LOAD_FAILED));
    expect(selected()).toBeNull();
  });
});

describe("step 1 overlapping picks (AC-10)", () => {
  it("keeps the most recent pick and stays silent about the abandoned one", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    let releaseFirst = () => {};
    const firstRead = new Promise<TemplateImage>((resolve) => {
      releaseFirst = () => resolve(template(800, 600));
    });
    getImageTemplate
      .mockReturnValueOnce(firstRead)
      .mockResolvedValueOnce(template(1200, 900));
    render(<GeneratePage />);

    pick(png("slow.png"));
    pick(png("fast.png"));

    // The second read settles first and owns the state.
    expect(await screen.findByText("Selected: fast.png")).toBeInTheDocument();

    // The abandoned first read lands afterwards and must change nothing.
    releaseFirst();

    await waitFor(() => expect(input()).toBeEnabled());
    expect(screen.getByText("Selected: fast.png")).toBeInTheDocument();
    expect(selected()).not.toHaveTextContent("slow.png");
    expect(thumbnail()).toHaveAttribute("width", "1200");
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("says nothing when the abandoned pick is the one that failed", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    let failFirst = () => {};
    const firstRead = new Promise<TemplateImage>((_resolve, reject) => {
      failFirst = () => reject(new Error("stale failure"));
    });
    getImageTemplate
      .mockReturnValueOnce(firstRead)
      .mockResolvedValueOnce(template(1200, 900));
    render(<GeneratePage />);

    pick(png("slow.png"));
    pick(png("fast.png"));

    expect(await screen.findByText("Selected: fast.png")).toBeInTheDocument();

    failFirst();

    await waitFor(() => expect(input()).toBeEnabled());
    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.getByText("Selected: fast.png")).toBeInTheDocument();
  });
});

describe("step 1 progress and collapse (AC-6, AC-14, AC-15)", () => {
  it("disables the picker while reading and hides Continue until a template loads", async () => {
    let release = () => {};
    getImageTemplate.mockReturnValue(
      new Promise<TemplateImage>((resolve) => {
        release = () => resolve(template(2970, 2100));
      }),
    );
    render(<GeneratePage />);

    expect(continueButton()).toBeNull();

    pick(png());

    expect(await screen.findByText("Reading template...")).toBeInTheDocument();
    expect(liveRegion()).toHaveTextContent("Reading template...");
    expect(input()).toBeDisabled();

    release();

    expect(await screen.findByText("Selected: cert.png")).toBeInTheDocument();
    expect(input()).toBeEnabled();
  });

  it("collapses through steps 2 and 3, then shows the real Step 4 (Preview)", async () => {
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);

    pick(png());
    await screen.findByText("Selected: cert.png");
    fireEvent.click(
      screen.getByRole("button", { name: /continue to step 2/i }),
    );

    expect(screen.queryByText(/drop your png/i)).toBeNull();
    expect(screen.getAllByText("cert.png")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Change" })).toBeInTheDocument();

    // Step 2 is feature 5 and is now a real card
    expect(
      screen.getByRole("heading", { name: "Upload Names File (CSV / TXT)" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /continue to step 3/i }),
    );

    // Step 3 is feature 6 and is now a real card (StepPosition)
    expect(
      screen.getByRole("heading", { name: "Map Name Column, Format & Style" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /continue to preview/i }),
    );

    // Step 4 is now a real component (StepPreview), not an inert card
    expect(
      screen.getByRole("heading", { name: "Certificate Preview & Generation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate all 3 certificates/i })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();

    // Step 5 is still inert (feature 8 not built yet) and only appears after step 4 completes
    // (when step > 4). It's not visible at step 4.
    expect(screen.queryByRole("heading", { name: "Download the batch" })).not.toBeInTheDocument();

    // Step 1 is the first collapsed card, so the first Change reopens it without
    // losing the template.
    fireEvent.click(screen.getAllByRole("button", { name: "Change" })[0]);

    expect(screen.getByText(/drop your png/i)).toBeInTheDocument();
    expect(screen.getByText("Selected: cert.png")).toBeInTheDocument();
  });
});

describe("step 1 drop target (AC-8)", () => {
  it("loads a dropped file and ignores a drop that carries no files", async () => {
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);

    fireEvent.drop(screen.getByText(/drop your png/i), {
      dataTransfer: { files: [png("dropped.png")] },
    });

    expect(
      await screen.findByText("Selected: dropped.png"),
    ).toBeInTheDocument();

    fireEvent.drop(screen.getByText(/drop your png/i), {
      dataTransfer: { files: [] },
    });

    await waitFor(() => expect(input()).toBeEnabled());
    expect(screen.getByText("Selected: dropped.png")).toBeInTheDocument();
    expect(getImageTemplate).toHaveBeenCalledTimes(1);
  });

  it("takes only the first file when several are dropped", async () => {
    getImageTemplate.mockResolvedValue(template(2970, 2100));
    render(<GeneratePage />);

    fireEvent.drop(screen.getByText(/drop your png/i), {
      dataTransfer: { files: [png("first.png"), png("second.png")] },
    });

    expect(await screen.findByText("Selected: first.png")).toBeInTheDocument();
    expect(getImageTemplate).toHaveBeenCalledTimes(1);
  });
});
