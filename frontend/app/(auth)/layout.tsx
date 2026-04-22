import { AmberGlow } from "@/components/features/ui/amber-glow";
import { Logomark } from "@/components/features/ui/logomark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="qs-root relative flex min-h-screen flex-col overflow-hidden bg-background text-qs-fg-muted">
      <AmberGlow size={380} opacity={0.12} top={-80} left={-60} />
      <AmberGlow size={300} opacity={0.08} bottom={-40} right={-40} color="deep" />

      <div className="relative z-10 flex items-center gap-2.5 px-6 py-7 md:px-10 md:py-8">
        <Logomark size={30} />
        <span className="text-[11px] font-semibold uppercase tracking-[2px] text-qs-fg-subtle">
          Quick Sermon
        </span>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-10 md:px-10">
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    </div>
  );
}
