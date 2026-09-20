import { cn } from "@/lib/utils";

export const COMING_SOON = "Em breve";
export const AI_GENERATION_COMING_SOON = "Geração por IA em breve";

export function ComingSoonNote({
  children = COMING_SOON,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("text-[11px] text-qs-fg-faint", className)}>
      {children}
    </span>
  );
}
