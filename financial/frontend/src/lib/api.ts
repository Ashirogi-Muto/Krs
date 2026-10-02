// Fetch wrapper for the FastAPI backend (same origin; nginx routes /api/* to the backend).
// Recreated 2 Oct 2026: the original src/lib was never committed (ignored by a Python "lib/" rule).

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function errorMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d) => (d && typeof d === "object" && "msg" in d ? String((d as { msg: unknown }).msg) : String(d))).join("; ");
  }
  return status === 401 ? "Please log in again." : `Request failed (${status})`;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "X-Requested-With": "XMLHttpRequest" }; // CSRF header required by the API
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(path, { method, headers, body: payload, credentials: "include" });
  // The server's idle timer restarts on every request; the app shell warns before it runs out
  if (typeof window !== "undefined" && res.ok) (window as unknown as { __krsLastApi?: number }).__krsLastApi = Date.now();
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    // Session ended (idle timeout, signed out elsewhere, password reset): back to the sign-in page
    if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/api/auth/") && window.location.pathname !== "/login") {
      window.location.href = "/login?expired=1";
    }
    throw new ApiError(res.status, errorMessage(data, res.status));
  }
  return data as T;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>("GET", path),
  post: <T = unknown>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T = unknown>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T = unknown>(path: string) => request<T>("DELETE", path),
  /** Multipart upload (receipts, spreadsheet import): the browser sets the multipart boundary. */
  upload: <T = unknown>(path: string, form: FormData) => request<T>("POST", path, form),
};
