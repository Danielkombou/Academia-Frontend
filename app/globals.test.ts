import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

const css = read("app/globals.css");
const componentsJson = JSON.parse(read("components.json"));

function extractBlock(source: string, header: string): string {
  const start = source.indexOf(header);
  if (start === -1) {
    throw new Error(`block not found: ${header}`);
  }
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") {
      depth += 1;
    } else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(open + 1, i);
      }
    }
  }
  throw new Error(`unterminated block: ${header}`);
}

const token = (blockText: string, name: string): string => {
  const match = blockText.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return match ? match[1].trim() : "";
};

const light = extractBlock(css, ":root {");
const dark = extractBlock(css, "\n.dark {");
const theme = extractBlock(css, "@theme inline {");

const LIGHT_TOKENS: Record<string, string> = {
  background: "oklch(1 0 0)",
  foreground: "oklch(0.223 0.012 172.9)",
  card: "oklch(1 0 0)",
  "card-foreground": "oklch(0.223 0.012 172.9)",
  popover: "oklch(1 0 0)",
  "popover-foreground": "oklch(0.223 0.012 172.9)",
  primary: "oklch(0.683 0.112 161.7)",
  "primary-foreground": "oklch(0.223 0.012 172.9)",
  secondary: "oklch(0.971 0.004 165)",
  "secondary-foreground": "oklch(0.281 0.017 172.7)",
  muted: "oklch(0.971 0.004 165)",
  "muted-foreground": "oklch(0.563 0.016 164.4)",
  accent: "oklch(0.951 0.009 164.9)",
  "accent-foreground": "oklch(0.223 0.012 172.9)",
  destructive: "oklch(0.637 0.208 25.3)",
  "destructive-foreground": "oklch(0.985 0 0)",
  border: "oklch(0.927 0.006 165)",
  input: "oklch(0.927 0.006 165)",
  ring: "oklch(0.683 0.112 161.7)",
};

const DARK_TOKENS: Record<string, string> = {
  background: "oklch(0.162 0.007 173.3)",
  foreground: "oklch(0.963 0.003 165.1)",
  card: "oklch(0.199 0.01 173)",
  "card-foreground": "oklch(0.963 0.003 165.1)",
  popover: "oklch(0.199 0.01 173)",
  "popover-foreground": "oklch(0.963 0.003 165.1)",
  primary: "oklch(0.683 0.112 161.7)",
  "primary-foreground": "oklch(0.223 0.012 172.9)",
  secondary: "oklch(0.266 0.011 173.3)",
  "secondary-foreground": "oklch(0.963 0.003 165.1)",
  muted: "oklch(0.266 0.011 173.3)",
  "muted-foreground": "oklch(0.73 0.012 164.7)",
  accent: "oklch(0.309 0.014 173.2)",
  "accent-foreground": "oklch(0.963 0.003 165.1)",
  destructive: "oklch(0.636 0.208 25.4)",
  "destructive-foreground": "oklch(0.985 0 0)",
  ring: "oklch(0.683 0.112 161.7)",
};

describe("Veni colour tokens", () => {
  it.each(
    Object.entries(LIGHT_TOKENS),
  )("defines the light %s token at its documented value", (name, value) => {
    expect(token(light, name)).toBe(value);
  });

  it.each(
    Object.entries(DARK_TOKENS),
  )("defines the dark %s token at its documented value", (name, value) => {
    expect(token(dark, name)).toBe(value);
  });

  it("keeps the ring token equal to the primary in both modes (AC-1)", () => {
    expect(token(light, "ring")).toBe(token(light, "primary"));
    expect(token(dark, "ring")).toBe(token(dark, "primary"));
  });

  it("keeps one brand green across light and dark (AC-1)", () => {
    expect(token(dark, "primary")).toBe(token(light, "primary"));
  });

  it("keeps dark ink as the primary foreground in both modes (AC-5)", () => {
    expect(token(light, "primary-foreground")).toBe(token(light, "foreground"));
    expect(token(dark, "primary-foreground")).toBe(
      token(light, "primary-foreground"),
    );
  });

  it("does not ship the extracted dark red that failed contrast (AC-9)", () => {
    expect(token(dark, "destructive")).not.toBe("oklch(0.396 0.133 25.7)");
  });

  it("keeps the dark border and input translucent so hovers still lift (AC-2)", () => {
    expect(token(dark, "border")).toMatch(/oklch\(1 0 0 \/ 10%\)/);
    expect(token(dark, "input")).toMatch(/oklch\(1 0 0 \/ 15%\)/);
  });

  it("defines all five chart tokens in light mode (AC-2)", () => {
    for (const step of [1, 2, 3, 4, 5]) {
      expect(token(light, `chart-${step}`)).not.toBe("");
    }
  });

  it("defines the full sidebar set (AC-2)", () => {
    for (const name of [
      "sidebar",
      "sidebar-foreground",
      "sidebar-primary",
      "sidebar-primary-foreground",
      "sidebar-accent",
      "sidebar-accent-foreground",
      "sidebar-border",
      "sidebar-ring",
    ]) {
      expect(token(light, name)).not.toBe("");
    }
  });

  it("mirrors each sidebar token onto the matching surface or brand token (AC-2)", () => {
    expect(token(light, "sidebar")).toBe("var(--background)");
    expect(token(light, "sidebar-foreground")).toBe("var(--foreground)");
    expect(token(light, "sidebar-primary")).toBe("var(--primary)");
    expect(token(light, "sidebar-border")).toBe("var(--border)");
    expect(token(light, "sidebar-ring")).toBe("var(--ring)");
  });

  it("exposes destructive-foreground to Tailwind (AC-2)", () => {
    expect(token(theme, "color-destructive-foreground")).toBe(
      "var(--destructive-foreground)",
    );
  });
});

describe("Veni shape scale", () => {
  it("sets the radius to 0.725rem (AC-3)", () => {
    expect(token(light, "radius")).toBe("0.725rem");
  });

  it.each([
    ["sm", "0.6"],
    ["md", "0.8"],
    ["xl", "1.4"],
    ["2xl", "1.8"],
    ["3xl", "2.2"],
    ["4xl", "2.6"],
  ])("keeps the %s radius on the scaffold multiplier", (step, factor) => {
    expect(token(theme, `radius-${step}`)).toBe(
      `calc(var(--radius) * ${factor})`,
    );
  });

  it("maps the large radius straight onto the radius token (AC-3)", () => {
    expect(token(theme, "radius-lg")).toBe("var(--radius)");
  });
});

describe("Veni font bindings", () => {
  it("binds sans to Outfit with generic fallbacks (AC-4)", () => {
    expect(token(theme, "font-sans")).toBe(
      "var(--font-outfit), ui-sans-serif, system-ui, sans-serif",
    );
  });

  it("binds serif to Nunito with generic fallbacks (AC-4)", () => {
    expect(token(theme, "font-serif")).toBe(
      "var(--font-nunito), ui-serif, Georgia, serif",
    );
  });

  it("binds mono to JetBrains Mono with a generic fallback (AC-4)", () => {
    expect(token(theme, "font-mono")).toBe(
      "var(--font-jetbrains-mono), ui-monospace, monospace",
    );
  });

  it("keeps the font-heading utility resolving to Outfit, not a fourth family (AC-4)", () => {
    expect(token(theme, "font-heading")).toBe(
      "var(--font-outfit), ui-sans-serif, system-ui, sans-serif",
    );
    expect(css).not.toMatch(/--font-heading:[^;]*Playfair/i);
  });

  it("binds no font token to a removed scaffold font (AC-4)", () => {
    expect(css).not.toMatch(/--font-[a-z]+:[^;]*(--font-geist|--font-noto)/i);
  });
});

describe("global stylesheet invariants", () => {
  it("keeps the theme block inline so values reach the utilities directly", () => {
    expect(css).toMatch(/@theme inline\s*\{/);
    expect(css).not.toMatch(/@theme\s*\{/);
  });

  it("has no custom property that points at itself", () => {
    const selfReference = /--([\w-]+)\s*:\s*var\(\s*--\1\s*\)/;
    expect(css).not.toMatch(selfReference);
  });

  it("keeps the dark class custom variant (AC-8)", () => {
    expect(css).toMatch(/@custom-variant dark \(&:is\(\.dark \*\)\);/);
  });

  it.each([
    '@import "tailwindcss"',
    '@import "tw-animate-css"',
    '@import "shadcn/tailwind.css"',
  ])("keeps the %s import", (statement) => {
    expect(css).toContain(statement);
  });

  it("keeps the base layer border, outline, background and text rules (AC-12)", () => {
    expect(css).toMatch(/@apply border-border outline-ring\/50/);
    expect(css).toMatch(/@apply bg-background text-foreground/);
    expect(css).toMatch(/html\s*\{\s*@apply font-sans;/);
  });

  it("introduces no universal letter spacing rule (AC-12)", () => {
    expect(css).not.toMatch(/letter-spacing/);
    expect(css).not.toMatch(/--letter-spacing/);
    expect(css).not.toMatch(/--tracking-normal/);
  });

  it("introduces no heading size or weight rule (AC-12)", () => {
    expect(css).not.toMatch(/^\s*h1\b/m);
    expect(css).not.toMatch(/--text-/);
  });

  it("keeps every colour utility Tailwind needs bound to a real token", () => {
    for (const name of [
      "color-background",
      "color-foreground",
      "color-primary",
      "color-primary-foreground",
      "color-border",
      "color-ring",
      "color-sidebar",
    ]) {
      expect(token(theme, name)).toMatch(/^var\(--[\w-]+\)$/);
    }
  });
});

describe("shadcn configuration (AC-11)", () => {
  it("no longer names taupe as the base color", () => {
    expect(componentsJson.tailwind.baseColor).not.toBe("taupe");
  });

  it("still points at the stylesheet this project actually edits", () => {
    expect(componentsJson.tailwind.css).toBe("app/globals.css");
  });
});
