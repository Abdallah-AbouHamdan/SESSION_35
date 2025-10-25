const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("fc_jwt");

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  const data = await res.json().catch(() => ({}));
  return data as T;
}
