"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, MoreHorizontal, Plus, Search } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";
import { Btn } from "@/components/features/ui/btn";
import { FilterChip } from "@/components/features/ui/filter-chip";
import { PageTopbar } from "@/components/features/ui/page-topbar";
import { StatusBadge } from "@/components/features/ui/status-badge";

type Role = "admin" | "editor" | "revisor";
type MemberStatus = "active" | "pending" | "suspended";

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: MemberStatus;
  lastActivity: string;
  avatarColor: string;
}

// TODO: Replace with real /users endpoint once backend exposes team management.
const PLACEHOLDER_MEMBERS: Member[] = [
  {
    id: "1",
    name: "Marcos Costa",
    email: "marcos@igreja.com",
    role: "admin",
    status: "active",
    lastActivity: "agora",
    avatarColor: "#f59e0b",
  },
  {
    id: "2",
    name: "Rita Alves",
    email: "rita@igreja.com",
    role: "editor",
    status: "active",
    lastActivity: "há 2h",
    avatarColor: "#60a5fa",
  },
  {
    id: "3",
    name: "Pastor Ricardo",
    email: "ricardo@igreja.com",
    role: "admin",
    status: "active",
    lastActivity: "ontem",
    avatarColor: "#c4b5fd",
  },
  {
    id: "4",
    name: "Bruno Santos",
    email: "bruno@igreja.com",
    role: "revisor",
    status: "active",
    lastActivity: "3 dias",
    avatarColor: "#34d399",
  },
  {
    id: "5",
    name: "Ana Paula",
    email: "ana@igreja.com",
    role: "editor",
    status: "pending",
    lastActivity: "convite enviado",
    avatarColor: "#f472b6",
  },
  {
    id: "6",
    name: "Igor Matos",
    email: "igor@igreja.com",
    role: "revisor",
    status: "suspended",
    lastActivity: "há 2 semanas",
    avatarColor: "#78716c",
  },
];

type FilterValue = "all" | Role | "pending";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "admin", label: "Admins" },
  { value: "editor", label: "Editores" },
  { value: "revisor", label: "Revisores" },
  { value: "pending", label: "Pendentes" },
];

const ROLE_STYLES: Record<Role, { bg: string; fg: string; label: string }> = {
  admin: {
    bg: "bg-[rgba(245,158,11,0.12)]",
    fg: "text-qs-amber-bright",
    label: "Admin",
  },
  editor: {
    bg: "bg-[rgba(96,165,250,0.12)]",
    fg: "text-qs-info",
    label: "Editor",
  },
  revisor: {
    bg: "bg-[rgba(196,181,253,0.14)]",
    fg: "text-qs-purple",
    label: "Revisor",
  },
};

export default function UsersPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  const filtered = PLACEHOLDER_MEMBERS.filter((m) => {
    if (filter === "pending" && m.status !== "pending") return false;
    if (filter !== "all" && filter !== "pending" && m.role !== filter)
      return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      if (
        !m.name.toLowerCase().includes(q) &&
        !m.email.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const stats = {
    members: PLACEHOLDER_MEMBERS.filter((m) => m.status === "active").length,
    pending: PLACEHOLDER_MEMBERS.filter((m) => m.status === "pending").length,
    plan: "6 / 10",
    reviewed: 128,
  };

  return (
    <>
      <PageTopbar
        title="Equipe"
        subtitle="Gerencie papéis, convites e assentos do plano."
        action={
          <div className="flex items-center gap-2">
            <Btn size="sm" variant="secondary" icon={<Link2 className="h-3 w-3" />}>
              Copiar link de convite
            </Btn>
            <Btn size="sm" variant="primary" icon={<Plus className="h-3 w-3" />}>
              Convidar membro
            </Btn>
          </div>
        }
      />
      <div className="flex flex-col gap-6">

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Membros ativos" value={stats.members.toString()} />
        <StatTile
          label="Convites"
          value={stats.pending.toString()}
          accent
        />
        <StatTile label="Plano" value={stats.plan} unit="assentos" />
        <StatTile
          label="Clips revisados"
          value={stats.reviewed.toString()}
          unit="este mês"
        />
      </section>

      {/* Filter + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              active={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </FilterChip>
          ))}
        </div>
        <div className="ml-auto flex h-9 w-[240px] items-center gap-2 rounded-lg border border-qs-line bg-qs-bg-elev px-3">
          <Search className="h-3.5 w-3.5 text-qs-fg-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar membro…"
            className="flex-1 bg-transparent text-[12px] text-qs-fg-muted placeholder:text-qs-fg-ghost focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-qs-line bg-qs-bg-elev">
        <div className="grid grid-cols-[minmax(0,2.2fr)_1fr_1fr_1fr_40px] items-center gap-3 border-b border-qs-line bg-qs-bg-elev-2 px-4 py-2.5">
          <HeaderLabel>Membro</HeaderLabel>
          <HeaderLabel>Função</HeaderLabel>
          <HeaderLabel>Status</HeaderLabel>
          <HeaderLabel>Última atividade</HeaderLabel>
          <span />
        </div>
        <ul>
          {filtered.length === 0 ? (
            <li className="px-4 py-10 text-center text-[13px] text-qs-fg-faint">
              Nenhum membro encontrado com esses filtros.
            </li>
          ) : (
            filtered.map((m) => (
              <li
                key={m.id}
                className="grid grid-cols-[minmax(0,2.2fr)_1fr_1fr_1fr_40px] items-center gap-3 border-b border-qs-line px-4 py-3 last:border-b-0 hover:bg-qs-bg-subtle"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-[#0c0a09]"
                    style={{ background: m.avatarColor }}
                  >
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-qs-fg">
                      {m.name}
                    </p>
                    <p className="truncate font-mono text-[11px] text-qs-fg-faint">
                      {m.email}
                    </p>
                  </div>
                </div>
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      ROLE_STYLES[m.role].bg,
                      ROLE_STYLES[m.role].fg,
                    )}
                  >
                    {ROLE_STYLES[m.role].label}
                  </span>
                </div>
                <div>
                  {m.status === "active" ? (
                    <StatusBadge state="published" label="Ativo" />
                  ) : m.status === "pending" ? (
                    <StatusBadge state="pending" label="Convite pendente" />
                  ) : (
                    <StatusBadge state="discarded" label="Suspenso" />
                  )}
                </div>
                <div className="font-mono text-[11px] text-qs-fg-faint">
                  {m.lastActivity}
                </div>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-qs-fg-faint hover:bg-qs-bg-elev-2 hover:text-qs-fg-muted"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="flex flex-wrap gap-4 rounded-xl border border-qs-line bg-qs-bg-elev p-4 font-mono text-[11px] text-qs-fg-faint">
        <Legend color="#f59e0b" label="Admin · controla tudo" />
        <Legend color="#60a5fa" label="Editor · cria clipes" />
        <Legend color="#c4b5fd" label="Revisor · revisa rascunhos" />
        <Legend color="#78716c" label="Suspenso · sem acesso" />
      </div>

      <p className="text-[11px] text-qs-fg-faint">
        Esta tela exibe dados de exemplo enquanto o backend de gestão de equipe
        não estiver disponível.
      </p>
      </div>
    </>
  );
}

function StatTile({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        accent
          ? "border-[rgba(245,158,11,0.22)] bg-gradient-to-br from-[rgba(245,158,11,0.10)] to-transparent"
          : "border-qs-line bg-qs-bg-elev",
      )}
    >
      <p className="text-[10.5px] font-semibold uppercase tracking-[1px] text-qs-fg-faint">
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-serif text-[26px] leading-none text-qs-fg">
          {value}
        </span>
        {unit && (
          <span className="text-[11px] text-qs-fg-faint">{unit}</span>
        )}
      </div>
    </div>
  );
}

function HeaderLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[1px] text-qs-fg-faint">
      {children}
    </span>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
