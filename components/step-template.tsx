"use client";

import { FileText, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TemplateSize {
  width: number;
  height: number;
}

interface StepTemplateProps {
  step: number;
  templateFile: File | null;
  templateDataUrl: string;
  templateDims: TemplateSize | null;
  isBusy: boolean;
  onTemplatePick: (file: File) => void;
  onNext: () => void;
  onEdit: () => void;
}

export function StepTemplate({
  step,
  templateFile,
  templateDataUrl,
  templateDims,
  isBusy,
  onTemplatePick,
  onNext,
  onEdit,
}: StepTemplateProps) {
  if (step < 1) return null;

  return (
    <div
      className={cn(
        "rounded-lg border p-6 transition-colors lg:p-8",
        step === 1
          ? "border-primary/50 bg-card shadow-xl"
          : "border-border bg-muted",
      )}
    >
      <div className="mb-4 flex items-center gap-4">
        <span className="rounded-md border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-sm font-bold text-primary">
          Step 1
        </span>
        <FileText
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <h2 className="font-heading text-xl font-semibold">
          Upload Certificate Template
        </h2>
      </div>

      {step === 1 ? (
        <StepTemplateBody
          templateFile={templateFile}
          templateDataUrl={templateDataUrl}
          templateDims={templateDims}
          isBusy={isBusy}
          onTemplatePick={onTemplatePick}
          onNext={onNext}
        />
      ) : (
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="flex min-w-0 items-center gap-2">
            <FileText
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="truncate">
              {templateFile?.name ?? "template.png"}
            </span>
          </span>
          <Button variant="outline" size="xs" onClick={onEdit}>
            Change
          </Button>
        </div>
      )}
    </div>
  );
}

function StepTemplateBody({
  templateFile,
  templateDataUrl,
  templateDims,
  isBusy,
  onTemplatePick,
  onNext,
}: Pick<
  StepTemplateProps,
  | "templateFile"
  | "templateDataUrl"
  | "templateDims"
  | "isBusy"
  | "onTemplatePick"
  | "onNext"
>) {
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // The file is captured before the input is emptied: clearing the value also
  // clears the file list, and an empty value is what lets the same file be
  // picked twice in a row, which is what makes retrying a failed file work.
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onTemplatePick(file);
  };

  // The drag handlers sit on this container rather than on the label, because
  // the label is pointer-events-none while busy so it cannot open the picker. A
  // drop during a read is still a valid superseding pick, so it has to keep
  // landing here. dragleave also fires when the pointer crosses a child, so the
  // depth counter is what decides whether the pointer really left.
  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);

    // A drop carrying no files at all (dragged text, a dragged link) is a no op.
    const file = event.dataTransfer.files?.[0];
    if (file) onTemplatePick(file);
  };

  return (
    /* biome-ignore lint/a11y/noStaticElementInteractions: a drop target is not a control and has no role. The control is the file input inside it, which is what keyboard and screen reader users operate. */
    <div
      className="flex flex-col gap-4"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="template-upload"
        accept=".png,.jpg,.jpeg,.pdf"
        disabled={isBusy}
        onChange={handleChange}
        className="peer sr-only"
      />

      <label
        htmlFor="template-upload"
        aria-disabled={isBusy}
        data-dragging={isDragging ? "true" : undefined}
        className={cn(
          "w-full cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors sm:p-10",
          "border-border hover:border-primary hover:bg-primary/5",
          "peer-focus-visible:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
          "data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/5",
          isBusy && "pointer-events-none opacity-60",
        )}
      >
        <Upload
          className="mx-auto mb-3 size-9 text-muted-foreground"
          aria-hidden
        />
        <p className="text-base font-medium">
          <strong>Drop your PNG / JPG / PDF template here</strong> or click to
          browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Recommended landscape 2970x2100px &middot; PDF first page is used
        </p>
        {templateFile && (
          <span className="mt-3 inline-block text-sm font-semibold text-primary">
            Selected: {templateFile.name}
          </span>
        )}
      </label>

      {/* Always in the DOM so the change is announced when the text swaps. */}
      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {isBusy ? "Reading template..." : ""}
      </p>

      {templateDataUrl && (
        // self-start stops the column flex parent stretching the image across its
        // cross axis, which would letterbox the picture inside a frame twice its
        // size. With the width free, max-h-64 scales both sides together.
        /* biome-ignore lint/performance/noImgElement: a user supplied template has no optimisable source, and next/image would resize the very image whose recorded dimensions every later step depends on. */
        <img
          src={templateDataUrl}
          alt={`Preview of the template ${templateFile?.name ?? ""}`.trim()}
          width={templateDims?.width}
          height={templateDims?.height}
          className="max-h-64 w-auto max-w-full self-start rounded-lg border border-border bg-background object-contain"
        />
      )}

      {templateFile && !isBusy && (
        <Button onClick={onNext} className="self-end">
          Continue to Step 2 &rarr;
        </Button>
      )}
    </div>
  );
}
