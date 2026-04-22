import { cn } from "@/lib/utils";

interface InfoTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}

export function InfoTile({
  icon,
  label,
  value,
  mono,
  className,
}: InfoTileProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-qs-line bg-qs-bg-elev p-[14px]",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-1.5 text-qs-amber-bright">
        <span className="flex h-[13px] w-[13px] items-center justify-center [&_svg]:h-[13px] [&_svg]:w-[13px]">
          {icon}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[1px] text-qs-fg-faint">
          {label}
        </span>
      </div>
      <div
        className={cn(
          "text-[14px] font-semibold text-qs-fg",
          mono && "font-mono tabular-nums",
        )}
      >
        {value}
      </div>
    </div>
  );
}
