"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { createVideo } from "@/lib/api/videos";

const YOUTUBE_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/;

export function VideoSubmitForm() {
  const router = useRouter();
  const t = useTranslations("videos.submit");
  const tErr = useTranslations("videos.errors");
  const [url, setUrl] = useState("");

  const isValid = YOUTUBE_REGEX.test(url);

  const mutation = useMutation({
    mutationFn: (sourceUrl: string) => createVideo(sourceUrl),
    onSuccess: (video) => {
      router.push(`/videos/${video.id}`);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    mutation.mutate(url);
  }

  const errorCode =
    (mutation.error as { response?: { data?: { error?: { code?: string } } } })
      ?.response?.data?.error?.code || "";

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      {mutation.isError && (
        <div className="mb-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">
            {tErr.has(errorCode) ? tErr(errorCode) : tErr("unknown")}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="source_url"
            className="text-sm font-medium text-gray-700 block"
          >
            {t("urlLabel")}
          </label>
          <input
            id="source_url"
            type="url"
            placeholder={t("urlPlaceholder")}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="flex w-full h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
          {url && !isValid && (
            <p className="text-xs text-red-500 mt-1">{t("invalidUrl")}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid || mutation.isPending}
          className="h-11 px-6 rounded-lg bg-amber-500 text-white font-medium text-sm tracking-wide hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {t("submitting")}
            </span>
          ) : (
            t("submit")
          )}
        </button>
      </form>
    </div>
  );
}
