import { cleanup, render, screen } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import RootLayout, { metadata } from "./layout";

const { fontCalls } = vi.hoisted(() => ({
  fontCalls: [] as Array<{ family: string; options: Record<string, unknown> }>,
}));

vi.mock("next/font/google", () => {
  const loader = (family: string) => (options: Record<string, unknown>) => {
    fontCalls.push({ family, options });
    return {
      className: `${family.replace(/\s+/g, "-")}-fallback`,
      variable: `${String(options.variable)}__resolved`,
      style: { fontFamily: family },
    };
  };
  return {
    Outfit: loader("Outfit"),
    Nunito: loader("Nunito"),
    JetBrains_Mono: loader("JetBrains Mono"),
  };
});

// Rendering a root layout necessarily nests html and body inside the test div, so
// React logs a DOM nesting warning that says nothing about this code being wrong.
// Only that warning is filtered, and only for this file.
let consoleError: ReturnType<typeof vi.spyOn>;

beforeAll(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation((...args) => {
    const message = String(args[0] ?? "");
    if (
      message.includes("validateDOMNesting") ||
      message.includes("In HTML,")
    ) {
      return;
    }
    process.stderr.write(`${args.join(" ")}\n`);
  });
});

afterAll(() => {
  consoleError.mockRestore();
});

// Next 16 typed routes give the layout a params promise alongside its children.
const renderLayout = (children: React.ReactNode) =>
  render(<RootLayout params={Promise.resolve({})}>{children}</RootLayout>);

// React writes the layout's html and body onto the real document rather than into
// the render container, so these read the document and reset it between tests.
const htmlElement = () => document.documentElement;
const bodyElement = () => document.body;

// The layout is mounted onto the real document, so each test must unmount it and
// clear the attributes it wrote before the next one renders.
afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("class");
  document.body.removeAttribute("class");
});

describe("root layout", () => {
  it("renders its children (happy path)", () => {
    renderLayout(<p>Veni</p>);

    expect(screen.getByText("Veni")).toBeInTheDocument();
  });

  it("declares the document language for assistive technology", () => {
    renderLayout(<p>Veni</p>);

    expect(htmlElement()).toHaveAttribute("lang", "en");
  });

  it("requests the three Veni families from next/font (AC-4)", () => {
    renderLayout(<p>Veni</p>);

    expect(fontCalls.map((call) => call.family)).toEqual([
      "Outfit",
      "Nunito",
      "JetBrains Mono",
    ]);
  });

  it.each([
    ["Outfit", "--font-outfit"],
    ["Nunito", "--font-nunito"],
    ["JetBrains Mono", "--font-jetbrains-mono"],
  ])("asks %s for the %s custom property (AC-4)", (family, variable) => {
    renderLayout(<p>Veni</p>);

    expect(
      fontCalls.find((call) => call.family === family)?.options.variable,
    ).toBe(variable);
  });

  it("loads each family for the latin subset with a swap fallback (AC-4)", () => {
    renderLayout(<p>Veni</p>);

    for (const call of fontCalls) {
      expect(call.options.subsets).toEqual(["latin"]);
      expect(call.options.display).toBe("swap");
    }
  });

  it("puts the font custom properties on the html element (AC-4)", () => {
    renderLayout(<p>Veni</p>);

    for (const variable of [
      "--font-outfit__resolved",
      "--font-nunito__resolved",
      "--font-jetbrains-mono__resolved",
    ]) {
      expect(htmlElement().className).toContain(variable);
    }
  });

  it("applies the sans stack on the html element, not the body (AC-12)", () => {
    renderLayout(<p>Veni</p>);

    expect(htmlElement().className).toContain("font-sans");
    expect(bodyElement().className).not.toContain("font-sans");
  });

  it("colours text selection with the primary and its foreground (AC-12)", () => {
    renderLayout(<p>Veni</p>);

    expect(bodyElement().className).toContain("selection:bg-primary");
    expect(bodyElement().className).toContain(
      "selection:text-primary-foreground",
    );
  });

  it("exports metadata with a string title and description", () => {
    expect(typeof metadata.title).toBe("string");
    expect(typeof metadata.description).toBe("string");
  });
});
