// Browser only module, reached through one dynamic import from inside the names
// upload handler in app/(site)/generate/page.tsx. That is what keeps mammoth out
// of the first load of the route, out of the server bundle and out of
// prerendering. Do not import it from anywhere else, and never import it for
// real in a test.
//
// mammoth/mammoth.browser is a prebuilt browserify bundle with its own
// ArrayBuffer reader, so it needs no FileReader on our side. Its sibling
// mammoth/lib is the Node build and pulls in fs, which is why the browser one is
// the only entry point here.
import mammoth from "mammoth/mammoth.browser";

/**
 * The plain text of a Word document, which then goes through exactly the same
 * parse as a CSV or a TXT. Throws when the file is not a readable Word document,
 * and the caller turns that into the one alert.
 */
export const extractDocxText = async (file: File): Promise<string> => {
  const result = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  });
  return result.value;
};
