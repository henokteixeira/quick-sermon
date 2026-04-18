"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const MAX_LEN = 5000;

interface DescriptionEditorProps {
  generated: string | null;
  value: string;
  onChange: (value: string) => void;
  onRegenerate: () => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export function DescriptionEditor({
  generated,
  value,
  onChange,
  onRegenerate,
  disabled,
  readOnly,
}: DescriptionEditorProps) {
  const t = useTranslations("clips.review_page");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const chars = value.length;
  const overLimit = chars > MAX_LEN;
  const userEdited = !!value && value !== (generated ?? "");

  function handleRegenerateClick() {
    if (userEdited) {
      setConfirmOpen(true);
    } else {
      onRegenerate();
    }
  }

  function handleConfirmRegenerate() {
    setConfirmOpen(false);
    onRegenerate();
  }

  const hasContent = !!value;

  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <Label className="text-sm font-semibold text-foreground">
          {t("descriptionSection")}
        </Label>
        <button
          type="button"
          onClick={handleRegenerateClick}
          disabled={disabled || readOnly}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-40 dark:text-amber-400 dark:hover:bg-amber-500/10"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          {t("descriptionRegenerate")}
        </button>
      </header>

      <div className="px-4 py-4">
        {!hasContent && !generated && (
          <p className="mb-3 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            {t("aiPlaceholder")}
          </p>
        )}

        <Textarea
          className="min-h-[160px] resize-y"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("descriptionPlaceholder")}
          maxLength={MAX_LEN + 500}
          disabled={readOnly}
        />
        <div
          className={cn(
            "mt-1.5 text-right text-xs tabular-nums",
            overLimit ? "text-red-600" : "text-muted-foreground"
          )}
        >
          {t("descriptionCharCount", { count: chars })}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("regenerateConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("regenerateConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("regenerateConfirmCancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRegenerate}>
              {t("regenerateConfirmConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

