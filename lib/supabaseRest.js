export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const REST_BASE = SUPABASE_URL ? `${SUPABASE_URL}/rest/v1` : "";

function buildUrl(path, params = {}) {
  if (!REST_BASE) throw new Error("SUPABASE_URL belum di-set");
  const url = new URL(`${REST_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url;
}

function buildHeaders({ prefer, accept, hasBody } = {}) {
  if (!SUPABASE_KEY) throw new Error("SUPABASE_KEY belum di-set");
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };
  if (prefer) headers.Prefer = prefer;
  if (accept) headers.Accept = accept;
  if (hasBody) headers["Content-Type"] = "application/json";
  return headers;
}

export async function supabaseFetchJson(path, options = {}) {
  const {
    method = "GET",
    params,
    body,
    prefer,
    accept,
    timeoutMs = 10000,
  } = options;

  const url = buildUrl(path, params);
  const hasBody = body !== undefined && body !== null;
  const headers = buildHeaders({ prefer, accept, hasBody });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      return { ok: false, status: response.status, data: null, error: data || "Supabase error" };
    }

    return { ok: true, status: response.status, data, error: null };
  } catch (error) {
    return { ok: false, status: 500, data: null, error: error?.message || "Fetch error" };
  } finally {
    clearTimeout(timer);
  }
}
