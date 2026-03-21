export default function ReviewPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Revisao e Publicacao</h1>
      {/* TODO: YouTube preview, title selector, description editor, publish */}
      <p className="text-gray-500">Review video ID: {params.id}</p>
    </div>
  );
}
