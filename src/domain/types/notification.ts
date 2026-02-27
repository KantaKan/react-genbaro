export interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string;
  link_text?: string;
  is_active: boolean;
  priority: 'normal' | 'important' | 'urgent';
  start_date: string;
  end_date: string;
  created_at: string;
  is_read?: boolean;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  link?: string;
  link_text?: string;
  is_active: boolean;
  priority: 'normal' | 'important' | 'urgent';
  start_date: string;
  end_date: string;
}

export interface UpdateNotificationRequest {
  title?: string;
  message?: string;
  link?: string;
  link_text?: string;
  is_active?: boolean;
  priority?: 'normal' | 'important' | 'urgent';
  start_date?: string;
  end_date?: string;
}
