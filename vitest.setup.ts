import "@testing-library/jest-dom/vitest";

// jsdom implements no part of the CSS media query API. next-themes reads
// `prefers-color-scheme` on mount and subscribes to changes, so any test that
// renders the provider (directly, or through app/layout.tsx) needs one.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
