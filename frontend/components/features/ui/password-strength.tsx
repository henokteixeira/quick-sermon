import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^\w\s]/.test(pw)) score++;
  return Math.min(score, 4);
}

const LABELS = ["", "Fraca", "Razoável", "Boa", "Forte"];
const COLORS = [
  "bg-qs-line",
  "bg-qs-danger",
  "bg-qs-amber-deep",
  "bg-qs-amber",
  "bg-qs-amber-bright",
];

export function PasswordStrength({
  password,
  className,
}: PasswordStrengthProps) {
  const score = scorePassword(password);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= score ? COLORS[score] : "bg-qs-line",
            )}
          />
        ))}
      </div>
      <span className="font-mono text-[10px] uppercase tracking-wide text-qs-fg-faint">
        {LABELS[score]}
      </span>
    </div>
  );
}
