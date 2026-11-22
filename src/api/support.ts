export interface SupportMessage {
  id: string;
  message: string;
  date_added?: string;
  created?: string;
  is_user?: string | number | boolean;
  from_user?: string | number;
  sender_type?: string;
  is_read?: string | number | boolean;
}

export interface SupportChatData {
  chat_uid: string;
  messages: SupportMessage[];
  user_read?: string;
}

export interface SupportChatResponse {
  ok: boolean;
  data?: SupportChatData;
  message?: string;
}

const SUPPORT_API_BASE = 'https://support.danabol.club/index.php?route=support/api/';

function normalizeResponse(value: any): SupportChatResponse | null {
  if (!value || typeof value !== 'object') return null;
  if (!value.data) return { ok: Boolean(value.ok), message: value.message };

  const data = value.data;
  return {
    ok: Boolean(value.ok || value.data),
    message: value.message,
    data: {
      chat_uid: data.chat_uid ? String(data.chat_uid) : '',
      user_read: data.user_read ? String(data.user_read) : undefined,
      messages: Array.isArray(data.messages)
        ? data.messages.map((message: any, index: number) => ({
            ...message,
            id: String(message.id ?? message.message_id ?? index),
            message: String(message.message ?? ''),
          }))
        : [],
    },
  };
}

async function requestChat(url: string): Promise<SupportChatResponse | null> {
  try {
    const response = await fetch(url);
    return normalizeResponse(await response.json());
  } catch {
    return null;
  }
}

export async function fetchUserChat(
  customerId: number,
  encryptToken?: string,
): Promise<SupportChatResponse> {
  const tokenToUse = (encryptToken || '').trim();

  if (tokenToUse) {
    const params = new URLSearchParams({ user_id: tokenToUse });
    const response = await requestChat(`${SUPPORT_API_BASE}GetSiteChat&${params.toString()}`);
    if (response?.ok || response?.data) return response;
  }

  if (customerId > 0) {
    const params = new URLSearchParams({ order_id: '0', user_id: String(customerId) });
    const response = await requestChat(`${SUPPORT_API_BASE}GetOrderChat&${params.toString()}`);
    if (response?.ok || response?.data) return response;
  }

  if (customerId > 0) {
    const params = new URLSearchParams({ user_id: String(customerId) });
    const response = await requestChat(`${SUPPORT_API_BASE}GetSiteChat&${params.toString()}`);
    if (response?.ok || response?.data) return response;
  }

  return { ok: true, data: { chat_uid: '', messages: [] } };
}

export async function fetchChatByUid(
  chatUid: string,
  chatActive = true,
): Promise<SupportChatResponse> {
  if (!chatUid) return { ok: true, data: { chat_uid: '', messages: [] } };
  const params = new URLSearchParams({
    chat_uid: chatUid,
    chat_active: chatActive ? 'true' : 'false',
  });
  const response = await requestChat(`${SUPPORT_API_BASE}getChatbyUID&${params.toString()}`);
  return response || { ok: false, message: 'Не удалось загрузить чат поддержки' };
}

export async function sendChatMessage(
  chatUid: string,
  fromUser: string | number,
  message: string,
): Promise<SupportChatResponse> {
  const formData = new FormData();
  formData.append('chat_uid', chatUid);
  formData.append('from_user', String(fromUser));
  formData.append('message', message);

  try {
    const response = await fetch(`${SUPPORT_API_BASE}AddChatMessage`, {
      method: 'POST',
      body: formData,
    });
    return normalizeResponse(await response.json()) || {
      ok: false,
      message: 'Не удалось отправить сообщение',
    };
  } catch {
    return { ok: false, message: 'Ошибка подключения к поддержке' };
  }
}
