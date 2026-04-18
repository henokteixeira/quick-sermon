"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface WhatsappEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRegenerate: () => void;
  copyEnabled: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

export function WhatsappEditor({
  value,
  onChange,
  onRegenerate,
  copyEnabled,
  disabled,
  readOnly,
}: WhatsappEditorProps) {
  const t = useTranslations("clips.review_page");

  async function handleCopy() {
    if (!copyEnabled || !value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("whatsappCopied"));
    } catch {
      toast.error(t("publishError.unknown"));
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <Label className="text-sm font-semibold text-foreground">
          {t("whatsappSection")}
        </Label>
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
          {t("whatsappRegenerate")}
        </button>
      </header>

      <div className="px-4 py-4">
        <Textarea
          className="min-h-[110px] resize-y"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("whatsappPlaceholder")}
          disabled={readOnly}
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {!copyEnabled && t("whatsappCopyDisabledHint")}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!copyEnabled || !value}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {t("whatsappCopy")}
          </button>
        </div>
      </div>
    </section>
  );
}
