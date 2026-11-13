import { MOBILE_API_ROUTE } from '../config/constants';
import { buildMobileUrl, getMobileHeaders } from './common';
import type { AuthActionResponse, AuthSessionResponse } from '../types/auth';

export async function fetchMobileSession(token: string): Promise<AuthSessionResponse> {
  if (!token) return { loggedIn: false };
  try {
    const url = buildMobileUrl(MOBILE_API_ROUTE, { action: 'session', token });
    const res = await fetch(url, { headers: getMobileHeaders({}, token) });
    if (!res.ok) return { loggedIn: false };
    return await res.json();
  } catch {
    return { loggedIn: false };
  }
}

export async function loginMobileCustomer(
  email: string,
  password: string,
  deviceId?: string,
): Promise<AuthActionResponse> {
  const body = new URLSearchParams();
  body.set('email', email.trim());
  body.set('password', password);
  if (deviceId) body.set('device_id', deviceId);

  const url = buildMobileUrl(MOBILE_API_ROUTE, { action: 'login' });
  const res = await fetch(url, {
    method: 'POST',
    headers: getMobileHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
    body: body.toString(),
  });

  const data = await res.json().catch(() => null);
  if (!data) throw new Error(`Ошибка сервера (${res.status})`);
  return data;
}

export async function registerMobileCustomer(payload: {
  email: string;
  password: string;
  confirm_password: string;
  deviceId?: string;
}): Promise<AuthActionResponse> {
  const body = new URLSearchParams();
  body.set('email', payload.email.trim());
  body.set('password', payload.password);
  body.set('confirm_password', payload.confirm_password);
  if (payload.deviceId) body.set('device_id', payload.deviceId);

  const url = buildMobileUrl(MOBILE_API_ROUTE, { action: 'register' });
  const res = await fetch(url, {
    method: 'POST',
    headers: getMobileHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
    body: body.toString(),
  });

  const data = await res.json().catch(() => null);
  if (!data) throw new Error(`Ошибка сервера (${res.status})`);
  return data;
}

export async function logoutMobileCustomer(token: string): Promise<AuthActionResponse> {
  const body = new URLSearchParams();
  body.set('token', token);

  const url = buildMobileUrl(MOBILE_API_ROUTE, { action: 'logout' });
  const res = await fetch(url, {
    method: 'POST',
    headers: getMobileHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }, token),
    body: body.toString(),
  });

  return res.json().catch(() => ({ ok: true }));
}
