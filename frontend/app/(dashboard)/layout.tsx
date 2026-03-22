import { AuthGuard } from "@/components/features/auth/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex">
        <aside className="w-64 bg-gray-900 text-white p-4">
          <h2 className="text-lg font-bold mb-6">Quick Sermon</h2>
          <nav className="space-y-2">
            <a href="/" className="block py-2 px-3 rounded hover:bg-gray-800">
              Dashboard
            </a>
            <a
              href="/videos"
              className="block py-2 px-3 rounded hover:bg-gray-800"
            >
              Videos
            </a>
            <a
              href="/users"
              className="block py-2 px-3 rounded hover:bg-gray-800"
            >
              Usuarios
            </a>
            <a
              href="/settings"
              className="block py-2 px-3 rounded hover:bg-gray-800"
            >
              Configuracoes
            </a>
          </nav>
        </aside>
        <main className="flex-1 p-8 bg-gray-50">{children}</main>
      </div>
    </AuthGuard>
  );
}
