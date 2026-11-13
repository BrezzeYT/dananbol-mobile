import { API_INDEX } from '../config/constants';

export function buildMobileUrl(
  route: string,
  params: Record<string, string | number | undefined | null> = {}
): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  const qStr = parts.length > 0 ? `&${parts.join('&')}` : '';
  return `${API_INDEX}?route=${route}${qStr}`;
}

export function getMobileHeaders(
  extraHeaders: Record<string, string> = {},
  token?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...extraHeaders,
  };
  if (token) {
    headers['X-Mobile-Token'] = token;
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function handleApiResponse<T>(res: Response, label?: string): Promise<T> {
  if (!res.ok) {
    let detail = '';
    try {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        if (json && json.error) detail = json.error;
      } catch {
        const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
        if (clean) detail = clean;
      }
    } catch {}
    return { ok: false, error: detail ? `Ошибка сервера (${res.status}): ${detail}` : `API error: ${res.status}` } as unknown as T;
  }

  try {
    return await res.json();
  } catch {
    return { ok: false, error: 'Некорректный JSON от сервера' } as unknown as T;
  }
}
