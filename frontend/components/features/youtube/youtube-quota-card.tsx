"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getYouTubeQuota, getYouTubeConnection } from "@/lib/api/youtube";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function YouTubeQuotaCard() {
  const t = useTranslations("settings.youtube.quota");

  const { data: connection } = useQuery({
    queryKey: ["youtube-connection"],
    queryFn: getYouTubeConnection,
  });

  const { data: quota, isLoading } = useQuery({
    queryKey: ["youtube-quota"],
    queryFn: getYouTubeQuota,
    enabled: !!connection,
    refetchInterval: 60_000,
  });

  if (!connection || isLoading) return null;
  if (!quota) return null;

  const barColor = quota.blocked
    ? "bg-red-500"
    : quota.warning
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium">{t("title")}</h3>
        <p className="text-xs text-muted-foreground mt-1">{t("description")}</p>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {t("used", { used: quota.used, limit: quota.daily_limit })}
            </span>
            <span
              className={cn(
                "font-medium",
                quota.blocked
                  ? "text-red-500"
                  : quota.warning
                    ? "text-amber-500"
                    : "text-muted-foreground"
              )}
            >
              {quota.percent_used.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${Math.min(quota.percent_used, 100)}%` }}
            />
          </div>
          {quota.blocked && (
            <p className="text-xs text-red-500 font-medium">{t("blocked")}</p>
          )}
          {quota.warning && !quota.blocked && (
            <p className="text-xs text-amber-500">{t("warning")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
