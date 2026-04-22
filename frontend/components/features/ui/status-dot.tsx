import { cn } from "@/lib/utils";

interface StatusDotProps {
  state?: "ok" | "warn" | "down" | "neutral";
  size?: number;
  pulse?: boolean;
  className?: string;
}

const COLOR: Record<NonNullable<StatusDotProps["state"]>, string> = {
  ok: "bg-qs-ok",
  warn: "bg-qs-amber",
  down: "bg-qs-danger",
  neutral: "bg-qs-fg-faint",
};

export function StatusDot({
  state = "ok",
  size = 8,
  pulse,
  className,
}: StatusDotProps) {
  return (
    <span
      className={cn("relative inline-flex", className)}
      style={{ width: size, height: size }}
    >
      {pulse && (
        <span
          className={cn(
            "absolute inset-0 rounded-full opacity-50 animate-qs-ping",
            COLOR[state],
          )}
        />
      )}
      <span
        className={cn("relative rounded-full", COLOR[state])}
        style={{ width: size, height: size }}
      />
    </span>
  );
}
