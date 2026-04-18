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

interface DiscardConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discarding: boolean;
  onConfirm: () => void;
}

export function DiscardConfirmDialog({
  open,
  onOpenChange,
  discarding,
  onConfirm,
}: DiscardConfirmDialogProps) {
  const t = useTranslations("clips.review_page");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("discardConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("discardConfirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={discarding}>
            {t("discardConfirmCancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={discarding}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
          >
            {discarding ? t("discarding") : t("discardConfirmConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
