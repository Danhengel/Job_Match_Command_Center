const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "production" ? "https://jobmatchcommandcenter-production.up.railway.app" : "http://localhost:8000");

export function getToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem("token");
}

const PUBLIC_AUTH_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/recovery/start",
  "/api/auth/reset-password",
]);

export async function api(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const requestPath = path === "/api/jobs/search"
    ? "/api/jobs/search-everywhere"
    : path;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${requestPath}`, { ...options, headers });
  } catch {
    throw new Error("Unable to reach the server. Please try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && typeof window !== "undefined" && !PUBLIC_AUTH_PATHS.has(requestPath)) {
    localStorage.removeItem("token");
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Your session expired. Please sign in again.");
  }
  if (!response.ok) {
    let message = "Request failed";
    if (Array.isArray(data.detail)) {
      message = data.detail.map((item: { loc?: string[]; msg?: string }) => {
        const field = item.loc?.[item.loc.length - 1]?.replaceAll("_", " ") || "Field";
        return `${field}: ${item.msg || "Invalid value"}`;
      }).join("\n");
    } else if (typeof data.detail === "string") {
      message = data.detail;
    }
    throw new Error(message);
  }
  return data;
}

export async function uploadApi(path: string, body: FormData) {
  const token = getToken();
  const headers: Record<string,string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { method: "POST", headers, body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Upload failed");
  return data;
}

export async function downloadApi(path: string, filename: string) {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { headers });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Download failed");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
