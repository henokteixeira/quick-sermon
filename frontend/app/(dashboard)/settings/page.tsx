"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { YouTubeConnectionCard } from "@/components/features/youtube/youtube-connection-card";
import { YouTubeQuotaCard } from "@/components/features/youtube/youtube-quota-card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const youtubeParam = searchParams.get("youtube");

  useEffect(() => {
    if (youtubeParam === "connected") {
      queryClient.invalidateQueries({ queryKey: ["youtube-connection"] });
    }
  }, [youtubeParam, queryClient]);

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>

      {youtubeParam === "connected" && (
        <Alert className="mt-6 border-emerald-500/20 bg-emerald-500/5">
          <AlertDescription className="text-emerald-600 text-sm">
            {t("youtube.connectedSuccess")}
          </AlertDescription>
        </Alert>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-1">{t("integrations")}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t("integrationsDescription")}</p>

        <div className="space-y-4">
          {isAdmin ? (
            <>
              <YouTubeConnectionCard />
              <YouTubeQuotaCard />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("adminOnly")}</p>
          )}
        </div>
      </section>
    </div>
  );
}
