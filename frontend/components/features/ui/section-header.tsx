import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-end justify-between gap-2",
        className,
      )}
    >
      <div>
        <h2 className="font-serif text-[20px] leading-tight tracking-[-0.3px] text-qs-fg">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-[12px] text-qs-fg-faint">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
