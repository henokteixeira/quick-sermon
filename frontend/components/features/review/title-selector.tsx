"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Btn } from "@/components/features/ui/btn";

const MAX_LEN = 100;

interface TitleSelectorProps {
  generated: string[] | null;
  value: string;
  onChange: (value: string) => void;
  onRegenerate: () => void;
  disabled?: boolean;
  readOnly?: boolean;
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
  const [manualMode, setManualMode] = useState(() => {
    if (!generated || generated.length === 0) return true;
    return !!value && !generated.includes(value);
  });

  const options = generated ?? [];
  const primary = options[0] ?? null;
  const secondary = options.slice(1);

  const chars = value.length;
  const overLimit = chars > MAX_LEN;

  const isManualActive = manualMode || options.length === 0;

  function pickTitle(title: string) {
    setManualMode(false);
    onChange(title);
  }

  function enterManual() {
    setManualMode(true);
    if (options.includes(value)) onChange("");
  }

  return (
    <section className="overflow-hidden rounded-xl border border-qs-line bg-qs-bg-elev">
      <header className="flex items-center gap-2.5 border-b border-qs-line px-4 py-3">
        <Sparkles className="h-[13px] w-[13px] text-qs-purple" />
        <span className="text-[12px] font-semibold text-qs-fg">
          {t("titleSection")}
        </span>
        <span className="font-mono text-[10px] text-qs-fg-faint">
          {chars}/{MAX_LEN}
        </span>
        <div className="flex-1" />
        <Btn
          size="sm"
          variant="ghost"
          icon={<RefreshCw className="h-[11px] w-[11px]" />}
          onClick={onRegenerate}
          disabled={disabled || readOnly}
        >
          Regenerar
        </Btn>
      </header>

      <div className="px-4 pb-1.5 pt-3">
        {options.length === 0 && !isManualActive && (
          <p className="mb-3 rounded-lg border border-dashed border-qs-line bg-qs-bg-elev-2 p-3 text-[12px] text-qs-fg-faint">
            {t("aiPlaceholder")}
          </p>
        )}

        {primary && !isManualActive && (
          <button
            type="button"
            onClick={() => pickTitle(primary)}
            disabled={readOnly}
            className={cn(
              "mb-2.5 w-full rounded-md border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.05)] p-3 text-left transition-colors",
              value === primary
                ? "ring-2 ring-[rgba(167,139,250,0.35)]"
                : "hover:bg-[rgba(167,139,250,0.08)]",
              readOnly && "cursor-not-allowed",
            )}
          >
            <p className="font-serif text-[17px] leading-[1.25] tracking-[-0.3px] text-qs-fg">
              {primary}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-qs-fg-faint">
              <span className="font-mono">
                {primary.length}/{MAX_LEN}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-qs-purple">
                <Sparkles className="h-[9px] w-[9px]" />
                Sugerido pela IA
              </span>
            </div>
          </button>
        )}

        {secondary.length > 0 && !isManualActive && (
          <>
            <p className="mb-2 text-[11px] text-qs-fg-faint">Outras opções:</p>
            {secondary.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => pickTitle(opt)}
                disabled={readOnly}
                className={cn(
                  "mb-1.5 block w-full rounded-md border px-3 py-2.5 text-left text-[12px] leading-[1.35] text-qs-fg-muted transition-colors",
                  value === opt
                    ? "border-qs-amber bg-[rgba(245,158,11,0.06)]"
                    : "border-qs-line hover:border-qs-line-strong hover:bg-qs-bg-subtle",
                  readOnly && "cursor-not-allowed",
                )}
              >
                {opt}
              </button>
            ))}
          </>
        )}

        {isManualActive && (
          <div className="mb-2">
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              readOnly={readOnly}
              placeholder="Escreva um título curto e impactante"
              className="h-11 w-full rounded-lg border border-qs-line bg-qs-bg-elev-2 px-3 text-[13px] text-qs-fg outline-none placeholder:text-qs-fg-ghost focus:border-qs-amber"
            />
            <div
              className={cn(
                "mt-1 text-right font-mono text-[10.5px] tabular-nums",
                overLimit ? "text-qs-danger" : "text-qs-fg-faint",
              )}
            >
              {chars}/{MAX_LEN}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-qs-line/40 px-4 py-2.5">
        {isManualActive ? (
          options.length > 0 && (
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className="text-[11px] text-qs-fg-faint transition-colors hover:text-qs-amber-bright"
            >
              ← Voltar para sugestões da IA
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={enterManual}
            disabled={readOnly}
            className="text-[11px] text-qs-fg-faint transition-colors hover:text-qs-amber-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            Escrever manualmente →
          </button>
        )}
      </div>
    </section>
  );
}
