"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const MAX_LEN = 100;
const MANUAL_VALUE = "__manual__";

interface TitleSelectorProps {
  generated: string[] | null;
  value: string;
  onChange: (value: string) => void;
  onRegenerate: () => void;
  disabled?: boolean;
  readOnly?: boolean;
}

function pickSelection(generated: string[] | null, value: string): string {
  if (!value) return "";
  if (generated?.includes(value)) return value;
  return MANUAL_VALUE;
}

export function TitleSelector({
  generated,
  value,
  onChange,
  onRegenerate,
  disabled,
  readOnly,
}: TitleSelectorProps) {
  const t = useTranslations("clips.review_page");
  const [selection, setSelection] = useState<string>(pickSelection(generated, value));

  const chars = value.length;
  const overLimit = chars > MAX_LEN;

  function handleRadioChange(next: string) {
    setSelection(next);
    if (next === MANUAL_VALUE) {
      // Preserve existing manual value if any; otherwise blank
      if (generated?.includes(value)) onChange("");
    } else {
      onChange(next);
    }
  }

  const showManualInput = selection === MANUAL_VALUE;
  const options = generated ?? [];
  const hasGenerated = options.length > 0;

  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold text-foreground">
            {t("titleSection")}
          </Label>
          <span className="text-xs text-muted-foreground">({t("titleRequired")})</span>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={disabled || readOnly}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-40 dark:text-amber-400 dark:hover:bg-amber-500/10"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          {t("titleRegenerate")}
        </button>
      </header>

      <div className="px-4 py-4">
        {!hasGenerated && (
          <p className="mb-4 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            {t("aiPlaceholder")}
          </p>
        )}

        {hasGenerated && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("titleOptions")}
            </p>
            <RadioGroup
              value={selection}
              onValueChange={handleRadioChange}
              className="mt-2 space-y-1.5"
              disabled={readOnly}
            >
              {options.map((option, idx) => {
                const id = `title-option-${idx}`;
                const isSelected = selection === option;
                return (
                  <label
                    key={id}
                    htmlFor={id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm leading-snug transition-colors",
                      isSelected
                        ? "border-amber-400/60 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10"
                        : "border-border hover:bg-muted/40"
                    )}
                  >
                    <RadioGroupItem value={option} id={id} className="mt-0.5" />
                    <span className="flex-1">{option}</span>
                  </label>
                );
              })}
              <label
                htmlFor="title-manual"
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  selection === MANUAL_VALUE
                    ? "border-amber-400/60 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10"
                    : "border-border hover:bg-muted/40"
                )}
              >
                <RadioGroupItem value={MANUAL_VALUE} id="title-manual" className="mt-0.5" />
                <span className="flex-1 text-muted-foreground">{t("titleManual")}</span>
              </label>
            </RadioGroup>
          </div>
        )}

        {(showManualInput || !hasGenerated) && (
          <div className={cn(hasGenerated && "mt-4")}>
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={t("titleManual")}
              maxLength={MAX_LEN + 50}
              disabled={readOnly}
            />
            <div
              className={cn(
                "mt-1.5 text-right text-xs tabular-nums",
                overLimit ? "text-red-600" : "text-muted-foreground"
              )}
            >
              {t("titleCharCount", { count: chars })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
