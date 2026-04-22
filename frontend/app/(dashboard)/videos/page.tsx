"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { VideoListTable } from "@/components/features/videos/video-list-table";
import { VideoSubmitDialog } from "@/components/features/videos/video-submit-form";
import { Btn } from "@/components/features/ui/btn";
import { PageTopbar } from "@/components/features/ui/page-topbar";

export default function VideosPage() {
  const t = useTranslations("videos");

  return (
    <>
      <PageTopbar
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <VideoSubmitDialog>
            <Btn size="sm" variant="primary" icon={<Plus className="h-3 w-3" />}>
              {t("newVideo")}
            </Btn>
          </VideoSubmitDialog>
        }
      />
      <VideoListTable />
    </>
  );
}
