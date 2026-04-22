"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CreditCard,
  LogOut,
  Shield,
  Sparkles,
  User as UserIcon,
  Users as UsersIcon,
  Youtube,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { YouTubeConnectionCard } from "@/components/features/youtube/youtube-connection-card";
import { YouTubeQuotaCard } from "@/components/features/youtube/youtube-quota-card";
import { AuthField } from "@/components/features/ui/auth-field";
import { PageTopbar } from "@/components/features/ui/page-topbar";
import { cn } from "@/lib/utils";

type Section =
  | "profile"
  | "channels"
  | "ai"
  | "notifications"
  | "billing"
  | "team";

const SECTIONS: { key: Section; label: string; Icon: typeof UserIcon }[] = [
  { key: "profile", label: "Perfil", Icon: UserIcon },
  { key: "channels", label: "Canais conectados", Icon: Youtube },
  { key: "ai", label: "Preferências de IA", Icon: Sparkles },
  { key: "notifications", label: "Notificações", Icon: Bell },
  { key: "billing", label: "Plano & faturamento", Icon: CreditCard },
  { key: "team", label: "Equipe", Icon: UsersIcon },
];

export default function SettingsPage() {
  const t = useTranslations("settings");
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isAdmin = user?.role === "admin";
  const youtubeParam = searchParams.get("youtube");

  const [section, setSection] = useState<Section>("profile");

  useEffect(() => {
    if (youtubeParam === "connected") {
      queryClient.invalidateQueries({ queryKey: ["youtube-connection"] });
      setSection("channels");
    }
  }, [youtubeParam, queryClient]);

  function handleLogout() {
    clearAuth();
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  }

  return (
    <>
      <PageTopbar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Side nav */}
        <aside className="flex flex-col gap-1">
          {SECTIONS.map((s) => {
            const isActive = section === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSection(s.key)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-[rgba(245,158,11,0.10)] text-qs-amber-bright"
                    : "text-qs-fg-subtle hover:bg-qs-bg-subtle hover:text-qs-fg-muted",
                )}
              >
                <s.Icon className="h-[14px] w-[14px] shrink-0" />
                {s.label}
              </button>
            );
          })}
          <div className="my-2 border-t border-qs-line" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-qs-danger transition-colors hover:bg-[rgba(248,113,113,0.08)]"
          >
            <LogOut className="h-[14px] w-[14px] shrink-0" />
            Sair
          </button>
        </aside>

        {/* Main */}
        <div className="flex flex-col gap-5">
          {section === "profile" && <ProfileSection user={user} />}

          {section === "channels" && (
            <section className="flex flex-col gap-4">
              <SectionTitle
                title="Canais conectados"
                description="Conecte o YouTube para enviar clips automaticamente."
              />
              {youtubeParam === "connected" && (
                <div className="rounded-lg border border-[rgba(52,211,153,0.28)] bg-[rgba(52,211,153,0.10)] px-4 py-3 text-[12px] text-qs-ok">
                  {t("youtube.connectedSuccess")}
                </div>
              )}
              {isAdmin ? (
                <div className="flex flex-col gap-4">
                  <YouTubeConnectionCard />
                  <YouTubeQuotaCard />
                </div>
              ) : (
                <PlaceholderEmpty
                  icon={Shield}
                  title={t("adminOnly")}
                  description="Entre em contato com um administrador da conta."
                />
              )}
            </section>
          )}

          {section === "ai" && (
            <section className="flex flex-col gap-4">
              <SectionTitle
                title="Preferências de IA"
                description="Configure o tom de voz, uso de emojis e CTAs gerados."
              />
              <ComingSoon />
            </section>
          )}

          {section === "notifications" && (
            <section className="flex flex-col gap-4">
              <SectionTitle
                title="Notificações"
                description="Avisos por email e in-app."
              />
              <ComingSoon />
            </section>
          )}

          {section === "billing" && (
            <section className="flex flex-col gap-4">
              <SectionTitle
                title="Plano & faturamento"
                description="Gerencie seu plano e método de pagamento."
              />
              <ComingSoon />
            </section>
          )}

          {section === "team" && (
            <section className="flex flex-col gap-4">
              <SectionTitle
                title="Equipe"
                description="Convide membros e defina papéis."
              />
              <a
                href="/users"
                className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-qs-amber px-4 text-[13px] font-semibold text-[#0c0a09] shadow-[0_4px_14px_rgba(245,158,11,0.25)] hover:bg-qs-amber-bright"
              >
                <UsersIcon className="h-4 w-4" />
                Gerenciar equipe
              </a>
            </section>
          )}

          <DangerZone onLogout={handleLogout} />
        </div>
        </div>
      </div>
    </>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h2 className="font-serif text-[20px] leading-tight text-qs-fg">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-[12px] text-qs-fg-subtle">{description}</p>
      )}
    </div>
  );
}

function ProfileSection({
  user,
}: {
  user: { name?: string; email?: string } | null | undefined;
}) {
  const initial = user?.name?.charAt(0).toUpperCase() || "?";
  return (
    <section className="flex flex-col gap-5">
      <SectionTitle
        title="Perfil"
        description="Como você aparece dentro do Quick Sermon."
      />
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-qs-line bg-qs-bg-elev p-5">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[22px] font-bold text-[#0c0a09]"
          style={{
            background:
              "linear-gradient(135deg, #f59e0b 0%, #78350f 100%)",
          }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-[18px] text-qs-fg">
            {user?.name ?? "—"}
          </p>
          <p className="truncate text-[12px] text-qs-fg-faint">{user?.email}</p>
        </div>
        <button
          type="button"
          className="inline-flex h-9 items-center rounded-lg border border-qs-line bg-qs-bg-elev-2 px-3 text-[12px] font-medium text-qs-fg-muted hover:border-qs-line-strong"
        >
          Alterar foto
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-qs-line bg-qs-bg-elev p-5 md:grid-cols-2">
        <AuthField
          label="Nome"
          defaultValue={user?.name ?? ""}
          placeholder="Seu nome"
          disabled
        />
        <AuthField
          label="Email"
          defaultValue={user?.email ?? ""}
          placeholder="seu@email.com"
          disabled
        />
      </div>
      <p className="text-[11px] text-qs-fg-faint">
        Edição de perfil em breve. Por enquanto, fale com um administrador.
      </p>
    </section>
  );
}

function ComingSoon() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-qs-line bg-qs-bg-elev p-6">
      <Sparkles className="h-5 w-5 text-qs-amber" />
      <div>
        <p className="text-[13px] font-semibold text-qs-fg">Em breve</p>
        <p className="text-[12px] text-qs-fg-subtle">
          Estamos desenhando essa seção. Ela será liberada nas próximas
          semanas.
        </p>
      </div>
    </div>
  );
}

function PlaceholderEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof UserIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-qs-line bg-qs-bg-elev p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-qs-bg-elev-2 text-qs-fg-faint">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-qs-fg">{title}</p>
        {description && (
          <p className="text-[12px] text-qs-fg-subtle">{description}</p>
        )}
      </div>
    </div>
  );
}

function DangerZone({ onLogout }: { onLogout: () => void }) {
  return (
    <section className="mt-2 flex flex-col gap-3 rounded-xl border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.04)] p-5">
      <div>
        <h3 className="font-serif text-[16px] text-qs-danger">Zona de perigo</h3>
        <p className="mt-1 text-[12px] text-qs-fg-subtle">
          Ações irreversíveis. Tenha certeza antes de prosseguir.
        </p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-[rgba(248,113,113,0.28)] bg-[rgba(248,113,113,0.08)] px-3 text-[12px] font-medium text-qs-danger transition-colors hover:bg-[rgba(248,113,113,0.14)]"
      >
        <LogOut className="h-3.5 w-3.5" />
        Encerrar sessão neste dispositivo
      </button>
    </section>
  );
}
