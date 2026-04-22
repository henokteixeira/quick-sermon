"use client";

import { create } from "zustand";
import type { AppNotification } from "@/lib/types/notification";

const now = Date.now();
const minutes = (n: number) => new Date(now - n * 60_000).toISOString();
const hours = (n: number) => new Date(now - n * 3_600_000).toISOString();
const days = (n: number) => new Date(now - n * 86_400_000).toISOString();

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n-1",
    type: "clip_ready",
    category: "clips",
    title: "Clip pronto para revisão",
    body: "“Quando a tempestade é o convite” · 8min 42s · IA gerou título, descrição e mensagem de WhatsApp",
    createdAt: minutes(4),
    unread: true,
  },
  {
    id: "n-2",
    type: "publish",
    category: "clips",
    title: "3 clips publicados no YouTube",
    body: "Culto de Domingo · 06 abr — todos foram ao ar com sucesso",
    createdAt: minutes(28),
    unread: true,
  },
  {
    id: "n-3",
    type: "detection",
    category: "clips",
    title: "IA detectou 4 trechos candidatos",
    body: "Culto de Quarta · 09 abr · confiança média 87%",
    createdAt: hours(1),
    unread: true,
  },
  {
    id: "n-4",
    type: "error",
    category: "system",
    title: "Falha no upload para YouTube",
    body: "Cota diária atingiu 92%. Retry automático às 23:00.",
    createdAt: hours(18),
    unread: false,
  },
  {
    id: "n-5",
    type: "member",
    category: "team",
    title: "Luana Ferreira aceitou seu convite",
    body: "Agora pode editar e revisar clips · Função: Editor",
    createdAt: hours(22),
    unread: false,
  },
  {
    id: "n-6",
    type: "processing",
    category: "system",
    title: "Processamento concluído",
    body: "Conferência de Líderes — Sessão 2 · 1h 12min processada",
    createdAt: days(1),
    unread: false,
  },
  {
    id: "n-7",
    type: "quota",
    category: "system",
    title: "Uso semanal em 72%",
    body: "Você processou 18h de vídeo esta semana de um total de 25h",
    createdAt: days(1),
    unread: false,
  },
  {
    id: "n-8",
    type: "member",
    category: "team",
    title: "Ricardo revisou e aprovou 5 clips",
    body: "Culto de Quarta · 02 abr — todos encaminhados para publicação",
    createdAt: days(3),
    unread: false,
  },
  {
    id: "n-9",
    type: "detection",
    category: "system",
    title: "Nova versão do modelo de IA disponível",
    body: "Detecção 18% mais precisa · clique para atualizar",
    createdAt: days(3),
    unread: false,
  },
];

interface NotificationsState {
  isDrawerOpen: boolean;
  notifications: AppNotification[];
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  isDrawerOpen: false,
  notifications: INITIAL_NOTIFICATIONS,
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),
  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, unread: false } : n,
      ),
    })),
  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, unread: false })),
    })),
}));

export function groupByDate(items: AppNotification[]) {
  const today: AppNotification[] = [];
  const yesterday: AppNotification[] = [];
  const thisWeek: AppNotification[] = [];
  const older: AppNotification[] = [];
  const nowDate = new Date();
  const startOfToday = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate(),
  ).getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const startOfThisWeek = startOfToday - 7 * 86_400_000;

  for (const n of items) {
    const t = new Date(n.createdAt).getTime();
    if (t >= startOfToday) today.push(n);
    else if (t >= startOfYesterday) yesterday.push(n);
    else if (t >= startOfThisWeek) thisWeek.push(n);
    else older.push(n);
  }
  return { today, yesterday, thisWeek, older };
}

export function formatRelativeShort(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
