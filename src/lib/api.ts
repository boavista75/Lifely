import { getLocale, localizeError, text, type Locale } from "@/i18n";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  avatarUpdatedAt: string | null;
  locale?: Locale;
};

export type CloudState = {
  items: unknown[];
  notes: unknown[];
  nodes: unknown[];
  finances: unknown | null;
  mediaIds: string[];
};

async function parseError(response: Response): Promise<string> {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return localizeError(data?.error || text("error.requestFailed"));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "include",
      headers: init?.headers,
    });
  } catch {
    throw new ApiError(0, text("error.serverDown"));
  }
  if (!response.ok) throw new ApiError(response.status, await parseError(response));
  return (await response.json()) as T;
}

function json(body: unknown): RequestInit {
  return {
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function fetchMe(): Promise<{ user: PublicUser | null }> {
  return request("/api/auth/me");
}

export function login(identifier: string, password: string): Promise<{ user: PublicUser }> {
  return request("/api/auth/login", { method: "POST", ...json({ identifier, password }) });
}

export function register(input: {
  username: string;
  email: string;
  password: string;
}): Promise<{ user: PublicUser }> {
  return request("/api/auth/register", {
    method: "POST",
    ...json({ ...input, locale: getLocale() }),
  });
}

export function changeLocale(locale: Locale): Promise<{ user: PublicUser }> {
  return request("/api/auth/locale", { method: "POST", ...json({ locale }) });
}

export function logout(): Promise<{ ok: boolean }> {
  return request("/api/auth/logout", { method: "POST" });
}

export function changePassword(current: string, next: string): Promise<{ ok: boolean }> {
  return request("/api/auth/password", { method: "POST", ...json({ current, next }) });
}

export function changeUsername(username: string): Promise<{ user: PublicUser }> {
  return request("/api/auth/username", { method: "POST", ...json({ username }) });
}

export async function uploadAvatar(blob: Blob): Promise<PublicUser> {
  let response: Response;
  try {
    response = await fetch("/api/auth/avatar", {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": blob.type || "image/jpeg" },
      body: blob,
    });
  } catch {
    throw new ApiError(0, text("error.serverDown"));
  }
  if (!response.ok) throw new ApiError(response.status, await parseError(response));
  const data = (await response.json()) as { user: PublicUser };
  return data.user;
}

export async function deleteAvatar(): Promise<PublicUser> {
  const data = await request<{ user: PublicUser }>("/api/auth/avatar", { method: "DELETE" });
  return data.user;
}

export function fetchState(): Promise<CloudState> {
  return request("/api/state");
}

export function syncState(patch: unknown): Promise<{ ok: boolean }> {
  return request("/api/sync", { method: "POST", ...json(patch) });
}

export async function uploadMedia(id: string, blob: Blob): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`/api/media/${encodeURIComponent(id)}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "content-type": "application/octet-stream",
        "x-lifely-mime": blob.type || "application/octet-stream",
      },
      body: blob,
    });
  } catch {
    throw new ApiError(0, text("error.serverDown"));
  }
  if (!response.ok) throw new ApiError(response.status, await parseError(response));
}

export async function downloadMedia(id: string): Promise<Blob | null> {
  let response: Response;
  try {
    response = await fetch(`/api/media/${encodeURIComponent(id)}`, {
      credentials: "include",
    });
  } catch {
    throw new ApiError(0, text("error.serverDown"));
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new ApiError(response.status, await parseError(response));
  return response.blob();
}

export async function deleteRemoteMedia(id: string): Promise<void> {
  await request(`/api/media/${encodeURIComponent(id)}`, { method: "DELETE" });
}
