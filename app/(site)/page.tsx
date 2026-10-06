import { Hero } from "@/components/hero";

const STEPS = [
  "Template upload",
  "Names upload",
  "Position and name formatting",
  "Preview and generate",
  "Download the batch",
] as const;

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />

      <section
        aria-label="How generating a batch works"
        className="mx-auto w-full max-w-3xl px-4 pb-20"
      >
        <ol className="flex flex-col gap-6 sm:flex-row sm:gap-4">
          {STEPS.map((step, index) => (
            <li
              key={step}
              className="flex items-baseline gap-3 sm:flex-1 sm:flex-col sm:items-start sm:gap-2"
            >
              <span
                aria-hidden="true"
                className="font-mono text-xs text-primary"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-medium text-foreground">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
