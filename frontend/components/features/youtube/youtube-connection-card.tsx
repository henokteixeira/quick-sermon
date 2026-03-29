"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getYouTubeConnection, getOAuthAuthorizeUrl, disconnectYouTube } from "@/lib/api/youtube";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/formatters";

export function YouTubeConnectionCard() {
  const t = useTranslations("settings.youtube");
  const queryClient = useQueryClient();
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const { data: connection, isLoading } = useQuery({
    queryKey: ["youtube-connection"],
    queryFn: getYouTubeConnection,
  });

  const connectMutation = useMutation({
    mutationFn: getOAuthAuthorizeUrl,
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectYouTube,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["youtube-connection"] });
      queryClient.invalidateQueries({ queryKey: ["youtube-quota"] });
      setDisconnectOpen(false);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-5 bg-muted rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-muted rounded w-2/3 animate-pulse mt-3" />
        </CardContent>
      </Card>
    );
  }

  if (connection) {
    return (
      <>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <YouTubeIcon className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">{t("connected")}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {connection.channel_title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("connectedSince", { date: formatDate(connection.created_at) })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDisconnectOpen(true)}
                className="h-8 px-3 rounded-lg border border-input text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                {t("disconnect")}
              </button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("disconnectTitle")}</DialogTitle>
              <DialogDescription>{t("disconnectDescription")}</DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setDisconnectOpen(false)}
                className="h-9 px-4 rounded-lg border border-input text-sm font-medium hover:bg-muted transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {disconnectMutation.isPending ? t("disconnecting") : t("confirmDisconnect")}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <YouTubeIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-medium">{t("notConnected")}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("notConnectedDescription")}
              </p>
            </div>
          </div>
          <button
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            className="h-8 px-3 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50 shrink-0"
          >
            {connectMutation.isPending ? t("connecting") : t("connect")}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
