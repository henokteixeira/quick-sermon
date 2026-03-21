"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface HealthStatus {
  status: string;
  database: string;
}

export default function Home() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/health`
      );
      const data = await res.json();
      setHealth(data);
    } catch {
      setError(t("status.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[120px] top-[10%] left-[20%]" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-amber-700/8 blur-[100px] bottom-[15%] right-[15%]" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl w-full mx-auto px-6 py-16 min-h-screen flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <span className="text-stone-400 text-sm font-medium tracking-widest uppercase">
            {tc("appName")}
          </span>
        </div>

        {/* Hero */}
        <div className="space-y-12 py-12 text-center">
          <div className="space-y-5">
            <h1 className="text-5xl md:text-7xl font-serif text-white leading-tight">
              {t("hero.title")}
              <br />
              <span className="text-amber-400">{t("hero.titleAccent")}</span>
            </h1>
            <p className="text-stone-400 text-lg leading-relaxed max-w-lg mx-auto">
              {t("hero.subtitle")}
            </p>
          </div>

          {/* CTA */}
          <div className="flex gap-3 justify-center">
            <a
              href="/login"
              className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-amber-500 text-stone-950 font-medium text-sm tracking-wide hover:bg-amber-400 transition-colors"
            >
              {t("hero.cta")}
            </a>
            <a
              href="/register"
              className="inline-flex items-center justify-center h-12 px-8 rounded-lg border border-stone-700 text-stone-300 font-medium text-sm tracking-wide hover:border-stone-500 hover:text-white transition-colors"
            >
              {t("register")}
            </a>
          </div>

          {/* Status card */}
          <div className="border border-stone-800 rounded-xl p-5 bg-stone-900/50 backdrop-blur-sm max-w-sm mx-auto space-y-3 text-left">
            <h3 className="text-sm font-medium text-stone-300">
              {t("status.title")}
            </h3>

            {loading && (
              <div className="flex items-center gap-2 text-stone-500 text-sm">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("status.checking")}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                {error}
              </div>
            )}

            {health && (
              <div className="space-y-0">
                <div className="flex justify-between items-center py-2.5 border-b border-stone-800">
                  <span className="text-sm text-stone-500">{t("status.api")}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    health.status === "ok"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400"
                  }`}>
                    {health.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-sm text-stone-500">{t("status.database")}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    health.database === "healthy"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400"
                  }`}>
                    {health.database === "healthy" ? t("status.healthy") : health.database}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={checkHealth}
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
            >
              {t("status.refresh")}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-6 pt-8 border-t border-stone-800/50">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {["bg-amber-500", "bg-stone-600", "bg-amber-700"].map((bg, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-full ${bg} border-2 border-stone-950 flex items-center justify-center text-[10px] text-white font-medium`}
                >
                  {["M", "C", "A"][i]}
                </div>
              ))}
            </div>
            <p className="text-stone-600 text-xs">
              {t("hero.socialProof")}
            </p>
          </div>
          <span className="text-stone-700 text-xs">&middot; v1.0</span>
        </div>
      </div>
    </div>
  );
}
