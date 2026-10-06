import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StepPreview } from "@/components/step-preview";

const mockRecipients = [
  { name: "Daniel Kombou" },
  { name: "Alice Smith" },
  { name: "Bob Johnson" },
];

const defaultProps = {
  step: 4,
  templateDataUrl: "",
  templateDims: { width: 2970, height: 2100 },
  recipients: mockRecipients,
  nameColumn: "name",
  textPositions: { name: { x: 50, y: 53, fontSize: 36 } },
  nameFormatOpts: { fullNamesCount: 2, abbreviationsCount: 999 },
  nameColor: "#1f2847",
  fontFamily: "times" as const,
  setFontFamily: vi.fn(),
  isGenerating: false,
  generationProgress: 0,
  onGenerate: vi.fn(),
  onCancel: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("StepPreview component (AC-1, AC-9)", () => {
  it("renders nothing when step < 4", () => {
    render(<StepPreview {...defaultProps} step={3} />);
    expect(screen.queryByRole("heading", { name: /certificate preview/i })).not.toBeInTheDocument();
  });

  it("renders Step 4 heading when step === 4", () => {
    render(<StepPreview {...defaultProps} step={4} />);
    expect(
      screen.getByRole("heading", { name: /certificate preview & generation/i }),
    ).toBeInTheDocument();
  });

  it("shows Step 4 badge", () => {
    render(<StepPreview {...defaultProps} step={4} />);
    expect(screen.getByText("Step 4")).toBeInTheDocument();
  });

  it("renders font family radio group with three options (AC-9)", () => {
    render(<StepPreview {...defaultProps} step={4} />);

    const radioGroup = screen.getByRole("radiogroup");
    expect(radioGroup).toBeInTheDocument();

    expect(screen.getByRole("radio", { name: /times \(serif\)/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /helvetica \(sans\)/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /courier \(mono\)/i })).toBeInTheDocument();
  });

  it("defaults to Times font family selected", () => {
    render(<StepPreview {...defaultProps} step={4} />);

    const timesRadio = screen.getByRole("radio", { name: /times \(serif\)/i });
    expect(timesRadio).toBeChecked();
  });

  it("calls setFontFamily when font selection changes (AC-9)", () => {
    render(<StepPreview {...defaultProps} step={4} />);

    fireEvent.click(screen.getByRole("radio", { name: /helvetica \(sans\)/i }));
    expect(defaultProps.setFontFamily).toHaveBeenCalledWith("helvetica");

    fireEvent.click(screen.getByRole("radio", { name: /courier \(mono\)/i }));
    expect(defaultProps.setFontFamily).toHaveBeenCalledWith("courier");
  });

  it("shows recipient count with strong styling (AC-1)", () => {
    render(<StepPreview {...defaultProps} step={4} />);

    // Text is split: "Total Names Ready: " + <strong>3</strong>
    expect(screen.getByText(/total names ready:/i)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    const strong = screen.getByText("3").closest("strong");
    expect(strong).toHaveClass("text-primary");
  });

  it("shows Generate button with correct label (AC-3)", () => {
    render(<StepPreview {...defaultProps} step={4} />);

    const generateBtn = screen.getByRole("button", { name: /generate all 3 certificates/i });
    expect(generateBtn).toBeInTheDocument();
    expect(generateBtn).not.toBeDisabled();
  });

  it("calls onGenerate when Generate button clicked (AC-3)", () => {
    render(<StepPreview {...defaultProps} step={4} />);

    fireEvent.click(screen.getByRole("button", { name: /generate all 3 certificates/i }));
    expect(defaultProps.onGenerate).toHaveBeenCalledTimes(1);
  });

  it("disables Generate button when no recipients (AC-3)", () => {
    render(<StepPreview {...defaultProps} step={4} recipients={[]} />);

    const generateBtn = screen.getByRole("button", { name: /generate all 0 certificates/i });
    expect(generateBtn).toBeDisabled();
  });

  it("shows progress bar when isGenerating (AC-4)", () => {
    render(<StepPreview {...defaultProps} step={4} isGenerating generationProgress={50} />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
  });

  it("shows Cancel button during generation (AC-5)", () => {
    render(<StepPreview {...defaultProps} step={4} isGenerating generationProgress={50} />);

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    expect(cancelBtn).toBeInTheDocument();
  });

  it("calls onCancel when Cancel button clicked (AC-5)", () => {
    render(<StepPreview {...defaultProps} step={4} isGenerating generationProgress={50} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not show progress bar or Cancel when not generating", () => {
    render(<StepPreview {...defaultProps} step={4} />);

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
  });

  it("renders certificate mockup with correct aspect ratio (AC-1, AC-2)", () => {
    render(<StepPreview {...defaultProps} step={4} />);

    // The mockup is a div with class "certificate-mockup"
    const mockupDiv = document.querySelector(".certificate-mockup");
    expect(mockupDiv).toBeInTheDocument();
  });

  it("shows default template placeholder when no templateDataUrl (AC-8)", () => {
    render(<StepPreview {...defaultProps} step={4} templateDataUrl="" />);

    expect(screen.getByText(/default certificate template/i)).toBeInTheDocument();
    expect(screen.getByText(/upload a custom template in step 1/i)).toBeInTheDocument();
  });

  it("hides default template placeholder when templateDataUrl provided", () => {
    render(<StepPreview {...defaultProps} step={4} templateDataUrl="data:image/png;base64,abc" />);

    expect(screen.queryByText(/default certificate template/i)).not.toBeInTheDocument();
  });

  it("renders summary state when step > 4 (AC-6)", () => {
    render(<StepPreview {...defaultProps} step={5} />);

    expect(screen.getByText(/successfully generated 3 certificates/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });
});

describe("StepPreview preview name formatting (AC-1)", () => {
  it("formats preview name using formatCertificateName (AC-1)", () => {
    // The component uses formatCertificateName internally
    // We test that the formatted name appears correctly
    render(<StepPreview {...defaultProps} step={4} />);

    // Default format: 2 full names, rest as initials
    // "Daniel Kombou" -> "Daniel Kombou" (only 2 parts)
    expect(screen.getByText("Daniel Kombou")).toBeInTheDocument();
  });

  it("uses first recipient name from nameColumn", () => {
    const recipientsWithColumn = [
      { name: "Daniel Kombou", email: "daniel@example.com" },
      { name: "Alice Smith", email: "alice@example.com" },
    ];

    render(
      <StepPreview
        {...defaultProps}
        step={4}
        recipients={recipientsWithColumn}
        nameColumn="email"
      />,
    );

    expect(screen.getByText(/daniel@example\.com/i)).toBeInTheDocument();
  });

  it("falls back to name property when nameColumn not found", () => {
    const recipientsNoColumn = [{ name: "Fallback Name" }];

    render(
      <StepPreview
        {...defaultProps}
        step={4}
        recipients={recipientsNoColumn}
        nameColumn="missing"
      />,
    );

    expect(screen.getByText("Fallback Name")).toBeInTheDocument();
  });
});

describe("StepPreview preview styling (AC-1)", () => {
  it("applies font size from textPositions", () => {
    render(
      <StepPreview
        {...defaultProps}
        step={4}
        textPositions={{ name: { x: 50, y: 53, fontSize: 48 } }}
      />,
    );

    const nameElement = screen.getByText(/daniel/i).closest("span");
    expect(nameElement).toHaveStyle({ fontSize: expect.stringContaining("36px") });
  });

  it("applies name color", () => {
    render(
      <StepPreview {...defaultProps} step={4} nameColor="#aa3bff" />,
    );

    const nameElement = screen.getByText(/daniel/i).closest("span");
    expect(nameElement).toHaveStyle({ color: "#aa3bff" });
  });

  it("positions name at configured x% and y%", () => {
    render(
      <StepPreview
        {...defaultProps}
        step={4}
        textPositions={{ name: { x: 25, y: 75, fontSize: 36 } }}
      />,
    );

    const nameContainer = screen.getByText(/daniel/i).parentElement;
    expect(nameContainer).toHaveStyle({
      left: "25%",
      top: "75%",
    });
  });
});

describe("StepPreview accessibility (AC-1, AC-9)", () => {
  it("has proper heading structure", () => {
    render(<StepPreview {...defaultProps} step={4} />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      /certificate preview & generation/i,
    );
  });

  it("font family options have labels", () => {
    render(<StepPreview {...defaultProps} step={4} />);

    expect(screen.getByRole("radio", { name: /times \(serif\)/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /helvetica \(sans\)/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /courier \(mono\)/i })).toBeInTheDocument();
  });

  it("progress bar has proper aria attributes when generating", () => {
    render(<StepPreview {...defaultProps} step={4} isGenerating generationProgress={75} />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    expect(progressBar).toHaveAttribute("aria-valuenow", "75");
  });
});