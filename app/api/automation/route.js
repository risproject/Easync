import { NextResponse } from "next/server";
import { supabaseFetchJson } from "@/lib/supabaseRest";

function getDeviceId(request, body) {
  const { searchParams } = new URL(request.url);
  return searchParams.get("device_id") || body?.device_id || process.env.NEXT_PUBLIC_DEVICE_ID || "";
}

export async function GET(request) {
  const deviceId = getDeviceId(request);
  if (!deviceId) return NextResponse.json({ error: "device_id wajib" }, { status: 400 });

  const { ok, status, data, error } = await supabaseFetchJson("/automation", {
    params: {
      device_id: `eq.${deviceId}`,
      select: "*",
    },
    timeoutMs: 8000,
  });

  if (!ok) return NextResponse.json({ error }, { status });

  const row = Array.isArray(data) ? data[0] || null : data || null;
  return NextResponse.json({ data: row });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const deviceId = getDeviceId(request, body);
  if (!deviceId) return NextResponse.json({ error: "device_id wajib" }, { status: 400 });

  const nowIso = new Date().toISOString();
  const action = body.action || "update";

  if (action === "apply") {
    const { ok, status, data, error } = await supabaseFetchJson("/automation", {
      method: "PATCH",
      params: { device_id: `eq.${deviceId}` },
      body: { applied_at: nowIso },
      prefer: "return=representation",
      timeoutMs: 8000,
    });

    if (!ok) return NextResponse.json({ error }, { status });
    const row = Array.isArray(data) ? data[0] || null : data || null;
    return NextResponse.json({ data: row });
  }

  const payload = {
    device_id: deviceId,
    ...body,
    updated_at: body.updated_at || nowIso,
  };

  const { ok, status, data, error } = await supabaseFetchJson("/automation", {
    method: "POST",
    body: payload,
    prefer: "resolution=merge-duplicates,return=representation",
    timeoutMs: 8000,
  });

  if (!ok) return NextResponse.json({ error }, { status });

  const row = Array.isArray(data) ? data[0] || null : data || null;
  return NextResponse.json({ data: row });
}

