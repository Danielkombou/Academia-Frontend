"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatCertificateName } from "@/lib/nameFormat";

interface StepPreviewProps {
  step: number;
  templateDataUrl: string;
  templateDims: { width: number; height: number } | null;
  recipients: { name: string; [key: string]: string }[];
  nameColumn: string;
  textPositions: { name: { x: number; y: number; fontSize: number } };
  nameFormatOpts: { fullNamesCount: number; abbreviationsCount: number };
  nameColor: string;
  fontFamily: "times" | "helvetica" | "courier";
  setFontFamily: (font: "times" | "helvetica" | "courier") => void;
  isGenerating: boolean;
  generationProgress: number;
  onGenerate: () => void;
  onCancel?: () => void;
}

const FONT_OPTIONS = [
  { value: "times" as const, label: "Times (Serif)" },
  { value: "helvetica" as const, label: "Helvetica (Sans)" },
  { value: "courier" as const, label: "Courier (Mono)" },
] as const;

const FONT_STACKS: Record<"times" | "helvetica" | "courier", string> = {
  times: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  helvetica: "ui-sans-serif, system-ui, sans-serif",
  courier: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

export function StepPreview({
  step,
  templateDataUrl,
  templateDims,
  recipients,
  nameColumn,
  textPositions,
  nameFormatOpts,
  nameColor,
  fontFamily,
  setFontFamily,
  isGenerating,
  generationProgress,
  onGenerate,
  onCancel,
}: StepPreviewProps) {
  if (step < 4) return null;

  const aspectRatio = templateDims
    ? templateDims.width / templateDims.height
    : Math.SQRT2;

  const rawSample = recipients[0]
    ? recipients[0][nameColumn] || recipients[0].name || "Daniel Kombou"
    : "Daniel Kombou";

  const previewName = formatCertificateName(rawSample, nameFormatOpts);
  const previewFontSize = Math.max(16, textPositions.name.fontSize * 0.75);

  const serifStack = FONT_STACKS[fontFamily];
  let baselineOffset = previewFontSize * 0.8;
  const ctx = document.createElement("canvas").getContext("2d");
  if (ctx) {
    ctx.font = `bold ${previewFontSize}px ${serifStack}`;
    const metrics = ctx.measureText(previewName);
    const ascent = metrics.fontBoundingBoxAscent || previewFontSize * 0.8;
    const descent = metrics.fontBoundingBoxDescent || previewFontSize * 0.2;
    baselineOffset = (previewFontSize + ascent - descent) / 2;
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-6 transition-colors lg:p-8",
        step === 4
          ? "border-primary/50 bg-card shadow-xl"
          : "border-border bg-muted",
      )}
    >
      <div className="mb-4 flex items-center gap-4">
        <span className="rounded-md border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-sm font-bold text-primary">
          Step 4
        </span>
        <h2 className="font-heading text-xl font-semibold">
          Certificate Preview & Generation
        </h2>
      </div>

      {step === 4 ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 p-4 rounded-lg border border-border bg-muted">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Font Family
            </Label>
            <RadioGroup
              value={fontFamily}
              onValueChange={(v) =>
                v && setFontFamily(v as "times" | "helvetica" | "courier")
              }
              className="flex flex-wrap gap-4"
            >
              {FONT_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className={cn(
                    "inline-flex items-center gap-2 cursor-pointer text-sm",
                    fontFamily === value && "font-semibold text-primary",
                  )}
                >
                  <RadioGroupItem value={value} className="sr-only" />
                  {label}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div
            className="certificate-mockup relative w-full max-w-xl bg-white border-2 border-gray-300 rounded-xl shadow-2xl overflow-hidden"
            style={{
              aspectRatio: `${aspectRatio} / 1`,
              backgroundImage: templateDataUrl
                ? `url(${templateDataUrl})`
                : undefined,
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {!templateDataUrl && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col items-center justify-center p-6 border-4 border-primary">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                  Default Certificate Template
                </span>
                <span className="text-sm text-gray-400">
                  Upload a custom template in Step 1 to use your design
                </span>
              </div>
            )}
            <div
              className="absolute w-full text-center pointer-events-none"
              style={{
                left: `${textPositions.name.x}%`,
                top: `${textPositions.name.y}%`,
                transform: "translate(-50%, 0)",
              }}
            >
              <span
                className="font-serif font-bold drop-shadow-sm inline-block px-2"
                style={{
                  fontSize: `${previewFontSize}px`,
                  lineHeight: 1,
                  color: nameColor,
                  fontFamily: FONT_STACKS[fontFamily],
                  transform: `translateY(${-baselineOffset}px)`,
                }}
              >
                {previewName}
              </span>
            </div>
          </div>

          <div className="text-sm font-medium text-muted-foreground">
            Total Names Ready:{" "}
            <strong className="text-primary">{recipients.length}</strong>
          </div>

          {isGenerating && (
            <div className="w-full flex flex-col gap-2">
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <Progress
                  value={generationProgress}
                  className="h-3 rounded-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Generating PDFs... {generationProgress}%</span>
                {onCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    className="h-auto px-2 text-xs"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={onGenerate}
            disabled={isGenerating || recipients.length === 0}
            className="w-full py-4 self-end"
            size="lg"
          >
            {isGenerating
              ? "Generating Certificates..."
              : `Generate All ${recipients.length} Certificates`}
          </Button>
        </div>
      ) : (
        <div className="flex justify-between items-center text-sm font-medium">
          <span>Successfully generated {recipients.length} certificates</span>
          <Button variant="outline" size="xs" onClick={onCancel ?? (() => {})}>
            Edit
          </Button>
        </div>
      )}
    </div>
  );
}
