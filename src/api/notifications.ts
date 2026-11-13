import { MOBILE_API_ROUTE } from '../config/constants';
import { buildMobileUrl, getMobileHeaders, handleApiResponse } from './common';

export interface BackendNotification {
  id: string;
  message: string;
  type: 'success' | 'info';
  timestamp: number;
  date_added: string;
}

export interface NotificationsResponse {
  ok: boolean;
  error?: string;
  notifications?: BackendNotification[];
}

export async function fetchMobileNotifications(
  token: string
): Promise<NotificationsResponse> {
  if (!token) {
    return { ok: true, notifications: [] };
  }

  const url = buildMobileUrl(MOBILE_API_ROUTE, {
    action: 'notifications',
    token,
  });

  const res = await fetch(url, {
    headers: getMobileHeaders({}, token),
  });

  return handleApiResponse<NotificationsResponse>(res);
}

export async function clearMobileNotifications(
  token: string
): Promise<{ ok: boolean }> {
  if (!token) {
    return { ok: true };
  }

  const url = buildMobileUrl(MOBILE_API_ROUTE, {
    action: 'notifications',
    subaction: 'clear',
    token,
  });

  const res = await fetch(url, {
    headers: getMobileHeaders({}, token),
  });

  return handleApiResponse<{ ok: boolean }>(res);
}

export async function registerPushToken(
  token: string,
  pushToken: string
): Promise<{ ok: boolean }> {
  if (!token || !pushToken) {
    return { ok: false };
  }

  const url = buildMobileUrl(MOBILE_API_ROUTE, {
    action: 'register_push_token',
    token,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: getMobileHeaders({ 'Content-Type': 'application/json' }, token),
    body: JSON.stringify({ push_token: pushToken }),
  });

  return handleApiResponse<{ ok: boolean }>(res);
}
