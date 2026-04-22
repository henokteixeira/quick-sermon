"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  rightSlot?: React.ReactNode;
  containerClassName?: string;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField(
    {
      label,
      hint,
      error,
      rightSlot,
      containerClassName,
      className,
      id,
      ...props
    },
    ref,
  ) {
    const generatedId = id ?? props.name;
    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={generatedId}
            className="text-[12px] font-medium text-qs-fg-subtle"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "relative flex h-10 items-center rounded-lg border bg-qs-bg-elev-2 transition-colors focus-within:border-qs-amber",
            error
              ? "border-qs-danger"
              : "border-qs-line hover:border-qs-line-strong",
          )}
        >
          <input
            ref={ref}
            id={generatedId}
            className={cn(
              "h-full flex-1 bg-transparent px-3.5 text-[13px] text-qs-fg placeholder:text-qs-fg-ghost focus:outline-none",
              rightSlot && "pr-10",
              className,
            )}
            {...props}
          />
          {rightSlot && (
            <div className="absolute right-2 flex items-center">
              {rightSlot}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] text-qs-danger">{error}</p>
        ) : hint ? (
          <p className="font-mono text-[11px] text-qs-fg-faint">{hint}</p>
        ) : null}
      </div>
    );
  },
);
