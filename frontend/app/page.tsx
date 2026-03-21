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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-8 max-w-md px-6">
        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="hsl(var(--primary-foreground))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif font-normal text-foreground">
            {tc("appName")}
          </h1>
          <p className="text-muted-foreground">{tc("appDescription")}</p>
        </div>

        <div className="border border-border rounded-xl p-6 bg-card shadow-sm space-y-4">
          <h2 className="font-semibold text-lg text-card-foreground">
            {t("status.title")}
          </h2>

          {loading && (
            <p className="text-muted-foreground text-sm">
              {t("status.checking")}
            </p>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          {health && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-muted-foreground">{t("status.api")}</span>
                <span
                  className={`font-medium px-2 py-0.5 rounded-md text-xs ${
                    health.status === "ok"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {health.status}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-muted-foreground">
                  {t("status.database")}
                </span>
                <span
                  className={`font-medium px-2 py-0.5 rounded-md text-xs ${
                    health.database === "healthy"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {health.database === "healthy"
                    ? t("status.healthy")
                    : health.database}
                </span>
              </div>
            </div>
          )}

          <Button
            onClick={checkHealth}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            {t("status.refresh")}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {tc("appName")} &middot; v1.0
        </p>
      </div>
    </div>
  );
}
