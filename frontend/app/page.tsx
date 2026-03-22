"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/stores/auth-store";

interface HealthStatus {
  status: string;
  database: string;
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {ok && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
          ok ? "bg-emerald-400" : "bg-red-400"
        }`}
      />
    </span>
  );
}

export default function Home() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const checkHealth = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const healthUrl = baseUrl.endsWith("/api")
        ? baseUrl.replace(/\/api$/, "/health")
        : `${baseUrl}/health`;
      const res = await fetch(healthUrl);
      const data = await res.json();
      setHealth(data);
    } catch {
      setError(t("status.connectionError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    document.documentElement.style.backgroundColor = "#0c0a09";
    document.body.style.backgroundColor = "#0c0a09";
    checkHealth();
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-stone-950 text-stone-200 flex flex-col">
      {/* Ambient glows */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[120px] top-[10%] left-[20%] pointer-events-none" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-amber-700/8 blur-[100px] bottom-[15%] right-[15%] pointer-events-none" />

      {/* Content — fits in viewport */}
      <div className="relative z-10 max-w-3xl w-full mx-auto px-6 flex-1 flex flex-col justify-between py-10">
        {/* Header */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <span className="text-stone-400 text-sm font-medium tracking-widest uppercase">
            {tc("appName")}
          </span>
        </div>

        {/* Hero — centered */}
        <div className="space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-serif text-white leading-tight">
              {t("hero.title")}
              <br />
              <span className="text-amber-400">{t("hero.titleAccent")}</span>
            </h1>
            <p className="text-stone-400 text-base md:text-lg leading-relaxed max-w-md mx-auto">
              {t("hero.subtitle")}
            </p>
          </div>

          {/* CTA */}
          <div className="flex gap-3 justify-center">
            <a
              href={isAuthenticated ? "/dashboard" : "/login"}
              className="inline-flex items-center justify-center h-11 px-7 rounded-lg bg-amber-500 text-stone-950 font-medium text-sm tracking-wide hover:bg-amber-400 transition-colors"
            >
              {t("hero.cta")}
            </a>
            <a
              href="/register"
              className="inline-flex items-center justify-center h-11 px-7 rounded-lg border border-stone-700 text-stone-300 font-medium text-sm tracking-wide hover:border-stone-500 hover:text-white transition-colors"
            >
              {t("register")}
            </a>
          </div>

          {/* Status card — compact */}
          <div className="border border-stone-800 rounded-xl p-4 bg-stone-900/50 backdrop-blur-sm max-w-xs mx-auto text-left">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                {t("status.title")}
              </h3>
              <button
                onClick={() => checkHealth(true)}
                className="text-stone-600 hover:text-stone-300 transition-colors"
                title={t("status.refresh")}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={refreshing ? "animate-spin" : ""}
                >
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
              </button>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-stone-500 text-sm py-2">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("status.checking")}
              </div>
            )}

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                {error}
              </div>
            )}

            {health && !loading && (
              <div className="space-y-0">
                <div className="flex justify-between items-center py-2 border-b border-stone-800/50">
                  <div className="flex items-center gap-2">
                    <StatusDot ok={health.status === "ok"} />
                    <span className="text-sm text-stone-300">{t("status.api")}</span>
                  </div>
                  <span className={`text-xs ${
                    health.status === "ok" ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {health.status === "ok" ? t("status.operational") : t("status.down")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2">
                    <StatusDot ok={health.database === "healthy"} />
                    <span className="text-sm text-stone-300">{t("status.database")}</span>
                  </div>
                  <span className={`text-xs ${
                    health.database === "healthy" ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {health.database === "healthy" ? t("status.operational") : t("status.down")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex -space-x-2">
            {["bg-amber-500", "bg-stone-600", "bg-amber-700"].map((bg, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full ${bg} border-2 border-stone-950 flex items-center justify-center text-[9px] text-white font-medium`}
              >
                {["M", "C", "A"][i]}
              </div>
            ))}
          </div>
          <p className="text-stone-600 text-xs">
            {t("hero.socialProof")}
          </p>
        </div>
      </div>
    </div>
  );
}
