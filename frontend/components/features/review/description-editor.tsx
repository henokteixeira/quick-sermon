"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, Sparkles } from "lucide-react";
import { Btn } from "@/components/features/ui/btn";
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
    if (userEdited) setConfirmOpen(true);
    else onRegenerate();
  }

  function handleConfirmRegenerate() {
    setConfirmOpen(false);
    onRegenerate();
  }

  return (
    <section className="overflow-hidden rounded-xl border border-qs-line bg-qs-bg-elev">
      <header className="flex items-center gap-2.5 border-b border-qs-line px-4 py-3">
        <Sparkles className="h-[13px] w-[13px] text-qs-purple" />
        <span className="text-[12px] font-semibold text-qs-fg">
          {t("descriptionSection")}
        </span>
        <span className="font-mono text-[10px] text-qs-fg-faint">
          {chars}/{MAX_LEN}
        </span>
        <div className="flex-1" />
        <Btn
          size="sm"
          variant="ghost"
          icon={<RefreshCw className="h-[11px] w-[11px]" />}
          onClick={handleRegenerateClick}
          disabled={disabled || readOnly}
        >
          Regenerar
        </Btn>
      </header>

      <div className="p-4">
        {!value && !generated && (
          <p className="mb-3 rounded-lg border border-dashed border-qs-line bg-qs-bg-elev-2 p-3 text-[12px] text-qs-fg-faint">
            {t("aiPlaceholder")}
          </p>
        )}

        <div className="rounded-md border border-qs-line bg-qs-bg-elev-2">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
            maxLength={MAX_LEN + 500}
            disabled={readOnly}
            className="min-h-[180px] w-full resize-y whitespace-pre-line rounded-md bg-transparent p-3.5 text-[12px] leading-[1.6] text-qs-fg-muted outline-none placeholder:text-qs-fg-ghost"
          />
        </div>
        {overLimit && (
          <p className="mt-1.5 text-right font-mono text-[10.5px] text-qs-danger">
            Excedeu o limite de {MAX_LEN} caracteres
          </p>
        )}
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
