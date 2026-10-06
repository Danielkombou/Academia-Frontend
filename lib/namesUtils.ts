export interface Recipient {
  name: string;
  [key: string]: string;
}

/**
 * What a names file resolves to.
 *
 * `recipients` is null when the file left the recipient list alone, which is the
 * reference's own "keep what you had" case. The columns still update in that
 * case, because the reference sets them before it discovers the rows were blank,
 * and step 3 offers them in its name column picker.
 */
export interface ParsedNames {
  recipients: Recipient[] | null;
  columns: string[];
  nameColumn: string;
}

/** The demo recipients the reference app ships with, so the card is never empty. */
export const DEMO_RECIPIENTS: Recipient[] = [
  { name: "Daniel Kombou" },
  { name: "Alice Smith" },
  { name: "Bob Johnson" },
];

export const DEFAULT_COLUMNS = ["name"];
export const DEFAULT_NAME_COLUMN = "name";

export const DOCX_FAILED_MESSAGE =
  "Could not read the .docx file. Please make sure it is a valid Word document.";

// The reference decides on the extension alone, never the MIME type. A .docx
// often arrives with an empty or generic type, and trusting that would read the
// file as plain text and hand back mojibake instead of the alert.
export const isDocxFile = (file: File) =>
  file.name.toLowerCase().endsWith(".docx");

/**
 * One name, stripped of the list numbering and of the quotes a spreadsheet puts
 * around it, so `1. "Alice Smith"` becomes `Alice Smith`. The reference's own
 * two replaces, unchanged.
 */
export const cleanName = (raw: string) =>
  raw
    .trim()
    .replace(/^\s*\d+\s*[.)]\s*/, "")
    .replace(/^["']|["']$/g, "");

const cleanCell = (cell: string) => cell.trim().replace(/^["']|["']$/g, "");

/**
 * Parse the text of a CSV, TXT or DOCX names file.
 *
 * A file counts as CSV when any line holds a comma, which is how the reference
 * decides it. On that reading the first line is a header row and is dropped, and
 * the first column of every remaining line is the name. Otherwise every non
 * blank line is one name.
 *
 * Returns null for the reference's one true early return: a file with no non
 * blank line at all, where nothing is read and nothing changes.
 */
export const parseNamesText = (text: string): ParsedNames | null => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const isCsv = lines.some((line) => line.includes(","));

  if (!isCsv) {
    return {
      recipients: lines.map((line) => ({ name: cleanName(line) })),
      columns: DEFAULT_COLUMNS,
      nameColumn: DEFAULT_NAME_COLUMN,
    };
  }

  const columns = lines[0].split(",").map(cleanCell);
  const recipients: Recipient[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(cleanCell);
    const name = cleanName(values[0] || lines[i]);
    if (name) recipients.push({ name });
  }

  return {
    recipients: recipients.length > 0 ? recipients : null,
    columns,
    nameColumn: columns[0] || DEFAULT_NAME_COLUMN,
  };
};
