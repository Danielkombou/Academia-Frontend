import { describe, expect, it } from "vitest";

import {
  cleanName,
  DEFAULT_NAME_COLUMN,
  isDocxFile,
  parseNamesText,
} from "@/lib/namesUtils";

describe("isDocxFile", () => {
  it("reads the extension, not the MIME type", () => {
    // The reference's own test. A .docx with a generic type must still take the
    // Word path, or it is read as text and returns mojibake instead of an alert.
    expect(isDocxFile(new File([], "class.docx"))).toBe(true);
    expect(isDocxFile(new File([], "CLASS.DOCX"))).toBe(true);
    expect(isDocxFile(new File([], "names.csv"))).toBe(false);
    // A file named notes.doc with a Word MIME type is still not a .docx, so it
    // takes the plain text path.
    expect(isDocxFile(new File([], "notes.doc"))).toBe(false);
  });
});

describe("cleanName", () => {
  it("strips leading numbering in either form", () => {
    expect(cleanName("1. Daniel Kombou")).toBe("Daniel Kombou");
    expect(cleanName("42) Alice Smith")).toBe("Alice Smith");
    expect(cleanName("7.  Bob Johnson")).toBe("Bob Johnson");
  });

  it("strips one layer of surrounding quotes", () => {
    expect(cleanName('"Alice Smith"')).toBe("Alice Smith");
    expect(cleanName("'Alice Smith'")).toBe("Alice Smith");
    expect(cleanName('1. "Alice Smith"')).toBe("Alice Smith");
  });

  it("leaves an unnumbered, unquoted name alone", () => {
    expect(cleanName("  Daniel Kombou  ")).toBe("Daniel Kombou");
  });

  it("keeps a digit that is not list numbering", () => {
    expect(cleanName("Jean Paul Kombou 3")).toBe("Jean Paul Kombou 3");
  });
});

describe("parseNamesText: a plain list", () => {
  it("takes one name per non blank line", () => {
    const parsed = parseNamesText(
      "Daniel Kombou\n\nAlice Smith\nBob Johnson\n",
    );

    expect(parsed?.recipients).toEqual([
      { name: "Daniel Kombou" },
      { name: "Alice Smith" },
      { name: "Bob Johnson" },
    ]);
  });

  it("reports a single name column", () => {
    const parsed = parseNamesText("Alice Smith");

    expect(parsed?.columns).toEqual(["name"]);
    expect(parsed?.nameColumn).toBe("name");
  });

  it("strips numbering from every line", () => {
    const parsed = parseNamesText("1. Alice Smith\n2) Bob Johnson");

    expect(parsed?.recipients).toEqual([
      { name: "Alice Smith" },
      { name: "Bob Johnson" },
    ]);
  });
});

describe("parseNamesText: a CSV with headers", () => {
  it("drops the header row and takes the first column", () => {
    const parsed = parseNamesText(
      "Name,Email\nAlice Smith,a@b.c\nBob Johnson,d@e.f",
    );

    expect(parsed?.recipients).toEqual([
      { name: "Alice Smith" },
      { name: "Bob Johnson" },
    ]);
  });

  it("reports the header row as the available columns", () => {
    const parsed = parseNamesText("Name,Email\nAlice Smith,a@b.c");

    expect(parsed?.columns).toEqual(["Name", "Email"]);
    expect(parsed?.nameColumn).toBe("Name");
  });

  it("falls back to the name column when the header row is blank first", () => {
    const parsed = parseNamesText(",Email\nAlice Smith,a@b.c");

    expect(parsed?.columns).toEqual(["", "Email"]);
    expect(parsed?.nameColumn).toBe(DEFAULT_NAME_COLUMN);
  });

  it("strips quotes and numbering from a header cell and a value", () => {
    const parsed = parseNamesText('"Full Name",Email\n1. "Alice Smith",a@b.c');

    expect(parsed?.columns).toEqual(["Full Name", "Email"]);
    expect(parsed?.recipients).toEqual([{ name: "Alice Smith" }]);
  });

  it("counts as CSV when only a later line holds a comma", () => {
    // The reference decides on lines.some(...), not on the first line alone, so
    // this drops its first line as a header rather than keeping it as a name.
    const parsed = parseNamesText("Alice Smith\nBob Johnson,extra");

    expect(parsed?.recipients).toEqual([{ name: "Bob Johnson" }]);
  });

  it("falls back to the whole line when the first cell is empty", () => {
    // The reference's own values[0] || lines[i]. A bare "," row has no first
    // cell, so the row itself becomes the name, comma and all.
    const parsed = parseNamesText("Name,Email\n,\nAlice Smith,a@b.c");

    expect(parsed?.recipients).toEqual([
      { name: "," },
      { name: "Alice Smith" },
    ]);
  });

  it("keeps the recipients unchanged when every data row cleans to empty", () => {
    // A row of only quotes has no first cell and cleans away to nothing, so it
    // is dropped, and the parsed list is empty, so the caller keeps its own.
    const parsed = parseNamesText('Name,Email\n""\n""');

    expect(parsed?.recipients).toBeNull();
    expect(parsed?.columns).toEqual(["Name", "Email"]);
  });
});

describe("parseNamesText: a file that changes nothing", () => {
  it("returns null for an empty file", () => {
    expect(parseNamesText("")).toBeNull();
  });

  it("returns null for whitespace and blank lines only", () => {
    expect(parseNamesText("\n  \n\t\n")).toBeNull();
  });
});
