import { redirect } from "next/navigation";

export default function ClipReviewRedirect({
  params,
}: {
  params: { id: string; clipId: string };
}) {
  redirect(`/videos/${params.id}/clip/${params.clipId}?tab=revisao`);
}
