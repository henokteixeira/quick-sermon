"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthGuard } from "@/components/features/auth/auth-guard";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", key: "dashboard", icon: DashboardIcon },
  { href: "/videos", key: "videos", icon: VideosIcon },
  { href: "/users", key: "users", icon: UsersIcon, adminOnly: true },
  { href: "/settings", key: "settings", icon: SettingsIcon },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("dashboard.nav");
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const initial = user?.name?.charAt(0).toUpperCase() || "?";

  function handleLogout() {
    clearAuth();
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground flex-col shrink-0">
          <div className="p-5 pb-8">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-stone-950" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <span className="font-serif text-lg text-white">Quick Sermon</span>
            </Link>
          </div>

          <nav className="flex-1 px-3 space-y-0.5">
            {NAV_ITEMS.filter((item) => !("adminOnly" in item && item.adminOnly) || user?.role === "admin").map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-amber-500/10 text-amber-400 font-medium"
                      : "text-stone-400 hover:bg-white/5 hover:text-stone-200"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>

          {/* User profile + logout */}
          <div className="p-3 mt-auto border-t border-white/5">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-stone-950">{initial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-200 truncate">{user?.name}</p>
                <p className="text-xs text-stone-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                title={t("logout")}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-200 hover:bg-white/5 transition-colors shrink-0"
              >
                <LogoutIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-sidebar text-white border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-stone-950" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span className="font-serif text-base">Quick Sermon</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-xs font-semibold text-stone-950">{initial}</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-7 h-7 rounded-md flex items-center justify-center text-stone-400 hover:text-white transition-colors"
            >
              <LogoutIcon className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 bg-background min-h-0">
          <div className="p-4 md:p-8 pb-20 md:pb-8">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-white/5 flex items-center justify-around px-2 py-2 z-50">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] transition-colors min-w-[3.5rem]",
                  isActive
                    ? "text-amber-400"
                    : "text-stone-500"
                )}
              >
                <item.icon className="w-5 h-5" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
      </div>
    </AuthGuard>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function VideosIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
