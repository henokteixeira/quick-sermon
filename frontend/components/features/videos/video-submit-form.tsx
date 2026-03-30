"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createVideo } from "@/lib/api/videos";
import { getApiErrorCode } from "@/lib/api/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const YOUTUBE_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/;

export function VideoSubmitDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("videos.submit");
  const tErr = useTranslations("videos.errors");
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const isValid = YOUTUBE_REGEX.test(url);

  const mutation = useMutation({
    mutationFn: (sourceUrl: string) => createVideo(sourceUrl),
    onSuccess: (video) => {
      setOpen(false);
      setUrl("");
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      router.push(`/videos/${video.id}`);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    mutation.mutate(url);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setUrl("");
      mutation.reset();
    }
  }

  const errorCode = mutation.error ? getApiErrorCode(mutation.error) : "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-lg">
            <svg className="w-5 h-5 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        {mutation.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {tErr.has(errorCode) ? tErr(errorCode) : tErr("unknown")}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="source_url"
              className="text-sm font-medium text-foreground block"
            >
              {t("urlLabel")}
            </label>
            <div className="relative">
              <input
                id="source_url"
                type="url"
                placeholder={t("urlPlaceholder")}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
                required
                className="flex w-full h-11 rounded-lg border border-input bg-background pl-4 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              {url && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValid ? (
                    <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  )}
                </span>
              )}
            </div>
            {url && !isValid && (
              <p className="text-xs text-destructive">{t("invalidUrl")}</p>
            )}
            <p className="text-xs text-muted-foreground">
              youtube.com/watch?v= &middot; youtu.be/ &middot; youtube.com/live/
            </p>
          </div>

          <button
            type="submit"
            disabled={!isValid || mutation.isPending}
            className="w-full h-11 rounded-xl bg-amber-500 text-stone-950 font-semibold text-sm tracking-wide hover:bg-amber-400 transition-all shadow-sm shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {mutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("submitting")}
              </span>
            ) : (
              t("submit")
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
