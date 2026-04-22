"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutGrid,
  LogOut,
  Settings as SettingsIcon,
  Users as UsersIcon,
  Video,
  Workflow,
} from "lucide-react";
import { AuthGuard } from "@/components/features/auth/auth-guard";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";
import { AmberGlow } from "@/components/features/ui/amber-glow";
import { Logomark } from "@/components/features/ui/logomark";
import { NotificationsDrawer } from "@/components/features/notifications/notifications-drawer";

type NavItem = {
  href: string;
  key: "dashboard" | "videos" | "pipeline" | "users" | "settings";
  label: string;
  Icon: typeof LayoutGrid;
  adminOnly?: boolean;
  disabled?: boolean;
};

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

  const items: NavItem[] = [
    {
      href: "/dashboard",
      key: "dashboard",
      label: t("dashboard"),
      Icon: LayoutGrid,
    },
    { href: "/videos", key: "videos", label: t("videos"), Icon: Video },
    {
      href: "#",
      key: "pipeline",
      label: "Pipeline",
      Icon: Workflow,
      disabled: true,
    },
    {
      href: "/users",
      key: "users",
      label: t("users"),
      Icon: UsersIcon,
      adminOnly: true,
    },
    {
      href: "/settings",
      key: "settings",
      label: t("settings"),
      Icon: SettingsIcon,
    },
  ];

  const visible = items.filter(
    (item) => !item.adminOnly || user?.role === "admin",
  );

  function handleLogout() {
    clearAuth();
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  }

  return (
    <AuthGuard>
      <div className="qs-root relative flex min-h-screen w-full bg-background text-qs-fg-muted">
        {/* Desktop sidebar — expanded by default (220px) */}
        <aside
          className="sticky top-0 z-30 hidden h-screen w-[220px] shrink-0 flex-col border-r border-qs-line md:flex"
          style={{ background: "#0a0807" }}
        >
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center gap-2.5 overflow-hidden px-[17px]">
            <Logomark size={30} />
            <span className="whitespace-nowrap font-serif text-[18px] tracking-[-0.3px] text-qs-fg">
              Quick Sermon
            </span>
          </div>

          {/* Nav */}
          <nav className="flex flex-1 flex-col gap-0.5 overflow-hidden px-2.5 py-2">
            {visible.map((item) => {
              const isActive =
                item.href !== "#" && pathname.startsWith(item.href);
              const Inner = (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-[2px] rounded-full bg-qs-amber" />
                  )}
                  <item.Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="overflow-hidden whitespace-nowrap">
                    {item.label}
                  </span>
                </>
              );
              const classes = cn(
                "relative flex h-10 items-center gap-3 overflow-hidden rounded-lg px-3 text-[13px] transition-colors",
                isActive
                  ? "bg-[rgba(245,158,11,0.10)] font-semibold text-qs-amber-bright"
                  : "font-medium text-qs-fg-subtle hover:bg-white/5 hover:text-qs-fg-muted",
                item.disabled && "pointer-events-none opacity-40",
              );
              if (item.disabled) {
                return (
                  <div key={item.key} className={classes} title={item.label}>
                    {Inner}
                  </div>
                );
              }
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={classes}
                  title={item.label}
                >
                  {Inner}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="shrink-0 border-t border-qs-line p-2">
            <div className="flex items-center gap-2.5 overflow-hidden rounded-lg px-2 py-2">
              <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-qs-amber text-[12px] font-bold text-[#0c0a09]">
                {initial}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="truncate text-[12px] font-semibold text-qs-fg">
                  {user?.name}
                </div>
                <div className="text-[10px] capitalize text-qs-fg-faint">
                  {user?.role}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title={t("logout")}
                className="shrink-0 rounded p-1 text-qs-fg-faint transition-colors hover:text-qs-fg-muted"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-qs-line bg-[#0a0807] px-4 py-3 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logomark size={28} />
            <span className="font-serif text-base text-qs-fg">Quick Sermon</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-qs-amber text-[11px] font-bold text-[#0c0a09]">
              {initial}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-7 w-7 items-center justify-center rounded text-qs-fg-faint hover:text-qs-fg-muted"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="qs-scroll relative min-w-0 flex-1">
          <AmberGlow size={480} opacity={0.05} top={-80} right={-80} />
          {/* Each page renders its own <PageTopbar /> at the top */}
          <div className="relative z-10 p-4 pb-24 md:p-8 md:pb-12">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-qs-line bg-[#0a0807] px-2 py-2 md:hidden">
          {visible.map((item) => {
            const isActive =
              item.href !== "#" && pathname.startsWith(item.href);
            if (item.disabled) {
              return (
                <div
                  key={item.key}
                  className="flex min-w-[3.5rem] flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] text-qs-fg-ghost"
                >
                  <item.Icon className="h-5 w-5" />
                  {item.label}
                </div>
              );
            }
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex min-w-[3.5rem] flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] transition-colors",
                  isActive ? "text-qs-amber-bright" : "text-qs-fg-faint",
                )}
              >
                <item.Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <NotificationsDrawer />
      </div>
    </AuthGuard>
  );
}
