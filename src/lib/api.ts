import { auth } from "@/lib/firebase";
import { MOCK_ENABLED, mockRequest } from "@/mocks/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

type Params = Record<string, string | number | boolean | undefined | null>;

const qs = (params?: Params) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
};

async function send<T>(method: string, path: string, body?: unknown, params?: Params, retry = true): Promise<T> {
  if (MOCK_ENABLED) return mockRequest<T>(method, path, params, body as Record<string, unknown> | Blob | undefined);
  const headers: Record<string, string> = {};
  // Files are sent as raw bytes (the API sniffs the real type); everything else is JSON.
  const isFile = typeof Blob !== "undefined" && body instanceof Blob;
  if (isFile) headers["Content-Type"] = (body as Blob).type || "application/octet-stream";
  else if (body !== undefined) headers["Content-Type"] = "application/json";

  // Attach the Firebase ID token when signed in; public endpoints simply ignore it.
  const user = auth?.currentUser;
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;

  let res: Response;
  try {
    res = await fetch(`/api${path}${qs(params)}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFile ? (body as Blob) : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.", "network");
  }

  // An expired token is refreshed once and the request replayed.
  if (res.status === 401 && user && retry) {
    await user.getIdToken(true);
    return send<T>(method, path, body, params, false);
  }

  if (res.status === 204) return undefined as T;

  // A proxy/CDN error page (HTML) must never be mistaken for data.
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    if (res.ok) throw new ApiError(502, "The server sent an unexpected response. Please try again.", "bad_response");
    data = {};
  }
  if (!res.ok) {
    const body = data as { error?: string; code?: string };
    throw new ApiError(res.status, body.error || "Something went wrong. Please try again.", body.code);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, params?: Params) => send<T>("GET", path, undefined, params),
  post: <T>(path: string, body?: unknown) => send<T>("POST", path, body ?? {}),
  patch: <T>(path: string, body: unknown) => send<T>("PATCH", path, body),
  put: <T>(path: string, body: unknown) => send<T>("PUT", path, body),
  delete: <T>(path: string) => send<T>("DELETE", path),
  upload: <T>(path: string, file: Blob) => send<T>("POST", path, file),
};
