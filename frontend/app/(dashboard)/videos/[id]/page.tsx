export default function VideoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Detalhes do Video</h1>
      {/* TODO: Video detail + timestamp editor */}
      <p className="text-gray-500">Video ID: {params.id}</p>
    </div>
  );
}
