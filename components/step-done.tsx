"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StepDoneProps {
  step: number;
  recipientCount: number;
  generatedPdfs: { name: string; blob: Blob }[];
  onDownloadZip: () => void;
  onDownloadSingle: () => void;
  onReset: () => void;
  isDownloading?: boolean;
}

export function StepDone({
  step,
  recipientCount,
  generatedPdfs,
  onDownloadZip,
  onDownloadSingle,
  onReset,
  isDownloading,
}: StepDoneProps) {
  if (step !== 5) return null;

  const firstPdfName = generatedPdfs[0]?.name || "Certificate.pdf";

  return (
    <div
      className={cn(
        "rounded-lg border p-6 lg:p-8 text-center flex flex-col items-center gap-6",
        step === 5
          ? "border-primary/50 bg-card shadow-xl"
          : "border-border bg-muted",
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <svg
          className="text-primary text-5xl"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h2 className="font-heading text-2xl font-bold">Done!</h2>
        <p className="text-muted-foreground">
          {recipientCount} certificates successfully generated as standalone PDFs and zipped.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <Button
          onClick={onDownloadZip}
          disabled={isDownloading}
          className="w-full sm:flex-1 py-4 px-6"
          size="lg"
        >
          {isDownloading ? "Creating ZIP..." : "Download ZIP Archive"}
        </Button>
        <Button
          variant="outline"
          onClick={onDownloadSingle}
          disabled={isDownloading}
          className="w-full sm:flex-1 py-4 px-6"
          size="lg"
        >
          Download Sample PDF ({firstPdfName})
        </Button>
      </div>

      <Button
        variant="ghost"
        onClick={onReset}
        disabled={isDownloading}
        className="text-primary font-semibold hover:underline mt-2"
      >
        Generate Another Batch
      </Button>
    </div>
  );
}