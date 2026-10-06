"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const COLOR_SWATCHES = [
  { label: "Navy", value: "#1f2847" },
  { label: "Purple", value: "#aa3bff" },
  { label: "Black", value: "#08060d" },
  { label: "Crimson", value: "#991b1b" },
  { label: "Blue", value: "#1e3a8a" },
  { label: "Green", value: "#166534" },
  { label: "Amber", value: "#d97706" },
] as const;

interface TextPositions {
  name: { x: number; y: number; fontSize: number };
}

interface NameFormatOptions {
  fullNamesCount: number;
  abbreviationsCount: number;
}

interface StepPositionProps {
  step: number;
  columns: string[];
  nameColumn: string;
  setNameColumn: (col: string) => void;
  textPositions: TextPositions;
  setTextPositions: (pos: TextPositions) => void;
  nameFormatOpts: NameFormatOptions;
  setNameFormatOpts: (opts: NameFormatOptions) => void;
  nameColor: string;
  setNameColor: (color: string) => void;
  onNext: () => void;
  onEdit: () => void;
}

export function StepPosition({
  step,
  columns,
  nameColumn,
  setNameColumn,
  textPositions,
  setTextPositions,
  nameFormatOpts,
  setNameFormatOpts,
  nameColor,
  setNameColor,
  onNext,
  onEdit,
}: StepPositionProps) {
  const [colorInput, setColorInput] = useState(nameColor);

  if (step < 3) return null;

  return (
    <div
      className={cn(
        "rounded-lg border p-6 transition-colors lg:p-8",
        step === 3
          ? "border-primary/50 bg-card shadow-xl"
          : "border-border bg-muted",
      )}
    >
      <div className="mb-4 flex items-center gap-4">
        <span className="rounded-md border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-sm font-bold text-primary">
          Step 3
        </span>
        <h2 className="font-heading text-xl font-semibold">
          Map Name Column, Format & Style
        </h2>
      </div>

      {step === 3 ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 p-4 rounded-lg border border-border bg-muted">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Name Column
            </Label>
            <Select
              value={nameColumn}
              onValueChange={(v) => v && setNameColumn(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 p-4 rounded-lg border border-border bg-muted">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Full Names to Appear
              </Label>
              <Select
                value={nameFormatOpts.fullNamesCount}
                onValueChange={(value) =>
                  setNameFormatOpts({
                    ...nameFormatOpts,
                    fullNamesCount: Number(value),
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={1}>1 Full Name</SelectItem>
                  <SelectItem value={2}>2 Full Names (Default)</SelectItem>
                  <SelectItem value={3}>3 Full Names</SelectItem>
                  <SelectItem value={999}>All Full Names</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1 p-4 rounded-lg border border-border bg-muted">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Abbreviations / Initials
              </Label>
              <Select
                value={nameFormatOpts.abbreviationsCount}
                onValueChange={(value) =>
                  setNameFormatOpts({
                    ...nameFormatOpts,
                    abbreviationsCount: Number(value),
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={0}>0 (None)</SelectItem>
                  <SelectItem value={1}>1 Abbreviation</SelectItem>
                  <SelectItem value={2}>2 Abbreviations</SelectItem>
                  <SelectItem value={999}>
                    All Remaining as Abbreviations
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-muted">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Name Color
            </Label>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="color"
                value={colorInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setColorInput(value);
                  setNameColor(value);
                }}
                className="w-12 h-10 rounded cursor-pointer border border-border bg-transparent p-1"
                title="Choose color"
              />
              <input
                type="text"
                value={colorInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setColorInput(value);
                  setNameColor(value);
                }}
                placeholder="#1f2847"
                className="p-2 rounded border border-border bg-background text-sm font-mono w-32"
              />
              <div className="flex items-center gap-2 flex-wrap ml-auto">
                {COLOR_SWATCHES.map((sw) => (
                  <button
                    key={sw.value}
                    type="button"
                    onClick={() => {
                      setColorInput(sw.value);
                      setNameColor(sw.value);
                    }}
                    className="w-7 h-7 rounded-full border-2 border-background shadow-sm transition-transform hover:scale-110 focus:outline-none"
                    style={{ backgroundColor: sw.value }}
                    title={sw.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-4 rounded-xl border border-border bg-muted">
            <Label className="text-sm font-semibold">
              Name Vertical Position ({textPositions.name.y}%)
            </Label>
            <Slider
              min={20}
              max={80}
              step={1}
              value={textPositions.name.y}
              onValueChange={(value) => {
                const newValue = Array.isArray(value) ? value[0] : value;
                setTextPositions({
                  name: { ...textPositions.name, y: newValue },
                });
              }}
              className="w-full"
            />
          </div>

          <Button onClick={onNext} className="self-end">
            Continue to Preview &rarr;
          </Button>
        </div>
      ) : (
        <div className="flex justify-between items-center text-sm font-medium">
          <span>
            Name Column: {nameColumn} | Color: {nameColor}
          </span>
          <Button variant="outline" size="xs" onClick={onEdit}>
            Edit
          </Button>
        </div>
      )}
    </div>
  );
}
