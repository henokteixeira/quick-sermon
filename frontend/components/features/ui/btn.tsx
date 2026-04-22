"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const SIZE: Record<Size, string> = {
  sm: "h-[30px] px-3 text-[12px] gap-1.5",
  md: "h-9 px-4 text-[13px] gap-1.5",
  lg: "h-11 px-[22px] text-[14px] gap-2",
};

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-qs-amber text-[#0c0a09] shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0_0_1px_rgba(245,158,11,0.3),0_4px_14px_rgba(245,158,11,0.25)] hover:bg-qs-amber-bright",
  secondary:
    "bg-qs-bg-elev-2 text-qs-fg-muted border border-qs-line hover:border-qs-line-strong",
  ghost:
    "bg-transparent text-qs-fg-subtle hover:bg-qs-bg-subtle hover:text-qs-fg-muted",
  danger:
    "bg-[rgba(248,113,113,0.10)] text-qs-danger border border-[rgba(248,113,113,0.25)] hover:bg-[rgba(248,113,113,0.16)]",
  outline:
    "bg-transparent text-qs-fg border border-qs-line hover:border-qs-line-strong",
};

export const Btn = forwardRef<HTMLButtonElement, BtnProps>(function Btn(
  {
    variant = "primary",
    size = "md",
    icon,
    iconRight,
    fullWidth,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold tracking-[0.1px] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        SIZE[size],
        VARIANT[variant],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
});
