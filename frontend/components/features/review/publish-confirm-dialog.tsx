"use client";

import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PublishConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  publishing: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
}

export function PublishConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  publishing,
  errorMessage,
  onConfirm,
}: PublishConfirmDialogProps) {
  const t = useTranslations("clips.review_page");

  const previewDescription = description.split("\n").slice(0, 2).join("\n");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("publishConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("publishConfirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("publishPreviewTitle")}
          </p>
          <p className="mt-1 font-semibold break-words">{title}</p>
          <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
            {t("publishPreviewDescription")}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground line-clamp-2">
            {previewDescription}
          </p>
        </div>

        {errorMessage && (
          <div className="mt-2 rounded-lg border border-red-400/50 bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={publishing}>
            {t("publishConfirmCancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={publishing}
          >
            {publishing ? t("publishing") : t("publishConfirmConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
