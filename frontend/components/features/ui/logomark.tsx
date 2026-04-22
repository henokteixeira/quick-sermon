import { cn } from "@/lib/utils";

interface LogomarkProps {
  size?: number;
  className?: string;
}

export function Logomark({ size = 32, className }: LogomarkProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-qs-amber shadow-[0_2px_8px_rgba(245,158,11,0.3)]",
        className,
      )}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: size * 0.28,
      }}
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="#0c0a09"
        stroke="#0c0a09"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    </div>
  );
}
