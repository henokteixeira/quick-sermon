"use client";

import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.style.backgroundColor = "#0c0a09";
    document.body.style.backgroundColor = "#0c0a09";
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-stone-950 text-stone-200 flex flex-col overflow-auto">
      {/* Ambient glows */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[120px] top-[5%] left-[15%] pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-amber-700/8 blur-[100px] bottom-[10%] right-[20%] pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <span className="text-stone-400 text-sm font-medium tracking-widest uppercase">
            Quick Sermon
          </span>
        </div>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
