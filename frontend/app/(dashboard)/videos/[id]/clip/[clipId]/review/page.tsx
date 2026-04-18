import { ReviewLayout } from "@/components/features/review/review-layout";

interface ReviewPageProps {
  params: { id: string; clipId: string };
}

export default function ReviewPage({ params }: ReviewPageProps) {
  return <ReviewLayout videoId={params.id} clipId={params.clipId} />;
}
