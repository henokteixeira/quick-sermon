export type NotificationType =
  | "clip_ready"
  | "publish"
  | "detection"
  | "error"
  | "member"
  | "processing"
  | "quota";

export type NotificationCategory = "clips" | "system" | "team";

export interface AppNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  /** ISO timestamp of when the event happened. */
  createdAt: string;
  unread: boolean;
}
