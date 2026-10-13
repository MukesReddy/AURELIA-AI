import type { ServerHealth } from '../types';

const USER_ID_KEY = 'aurelia_user_id';

export function getOrCreateUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = `usr-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`;
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export async function fetchServerHealth(): Promise<ServerHealth> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      return { ok: false, configured: false, missing: ['status_' + res.status] };
    }
    const data = await res.json();
    return {
      ok: Boolean(data.ok),
      configured: Boolean(data.configured),
      missing: Array.isArray(data.missing) ? data.missing : [],
    };
  } catch {
    return { ok: false, configured: false, missing: ['network_unreachable'] };
  }
}

export interface ChatResponse {
  answer: string;
}

export interface ChatErrorResponse {
  error: string;
  code?: string;
}

export async function sendChatMessage(
  message: string,
  sessionId: string,
  userId = getOrCreateUserId(),
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      sessionId,
      userId,
    }),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg =
      body && typeof body.error === 'string'
        ? body.error
        : `Request failed with status ${res.status}.`;
    throw new Error(errorMsg);
  }

  if (!body || typeof body.answer !== 'string') {
    throw new Error('Received an unexpected response format from the server.');
  }

  return body.answer;
}
