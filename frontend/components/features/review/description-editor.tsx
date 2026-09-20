"use client";

import { useTranslations } from "next-intl";
import { RefreshCw, Sparkles } from "lucide-react";
import { Btn } from "@/components/features/ui/btn";
import {
  ComingSoonNote,
  AI_GENERATION_COMING_SOON,
} from "@/components/features/ui/coming-soon";

const MAX_LEN = 5000;

interface DescriptionEditorProps {
  generated: string | null;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function DescriptionEditor({
  generated,
  value,
  onChange,
  readOnly,
}: DescriptionEditorProps) {
  const t = useTranslations("clips.review_page");

  const chars = value.length;
  const overLimit = chars > MAX_LEN;

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
        <ComingSoonNote className="text-[10px]">
          {AI_GENERATION_COMING_SOON}
        </ComingSoonNote>
        <Btn
          size="sm"
          variant="ghost"
          icon={<RefreshCw className="h-[11px] w-[11px]" />}
          disabled
          title={AI_GENERATION_COMING_SOON}
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
    </section>
  );
}
