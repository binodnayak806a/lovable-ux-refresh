export type NotificationType = 'info' | 'warning' | 'error' | 'success';
export type NotificationSource = 'system' | 'appointment' | 'lab' | 'pharmacy' | 'billing' | 'emergency' | 'ipd';

export interface AppNotification {
  id: string;
  user_id: string;
  hospital_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  source: NotificationSource;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: NotificationType;
  duration?: number;
}
