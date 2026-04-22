"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, MessageCircle, RefreshCw } from "lucide-react";
import { Btn } from "@/components/features/ui/btn";

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
    <section className="overflow-hidden rounded-xl border border-qs-line bg-qs-bg-elev">
      <header className="flex items-center gap-2.5 border-b border-qs-line px-4 py-3">
        <MessageCircle className="h-[13px] w-[13px] text-qs-ok" />
        <span className="text-[12px] font-semibold text-qs-fg">
          {t("whatsappSection")}
        </span>
        <div className="flex-1" />
        <div className="flex gap-1">
          <Btn
            size="sm"
            variant="ghost"
            icon={<RefreshCw className="h-[11px] w-[11px]" />}
            onClick={onRegenerate}
            disabled={disabled || readOnly}
          >
            Regenerar
          </Btn>
          <Btn
            size="sm"
            variant="secondary"
            icon={<Copy className="h-[11px] w-[11px]" />}
            onClick={handleCopy}
            disabled={!copyEnabled || !value}
            title={!copyEnabled ? t("whatsappCopyDisabledHint") : undefined}
          >
            Copiar
          </Btn>
        </div>
      </header>

      <div className="p-4">
        <div className="rounded-md border border-[rgba(74,222,128,0.15)] bg-[rgba(74,222,128,0.04)]">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("whatsappPlaceholder")}
            disabled={readOnly}
            className="min-h-[140px] w-full resize-y whitespace-pre-line rounded-md bg-transparent p-3.5 text-[12px] leading-[1.55] text-qs-fg-muted outline-none placeholder:text-qs-fg-ghost"
          />
        </div>
        {!copyEnabled && (
          <p className="mt-2 text-[11px] text-qs-fg-faint">
            {t("whatsappCopyDisabledHint")}
          </p>
        )}
      </div>
    </section>
  );
}
