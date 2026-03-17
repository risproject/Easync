import { NextResponse } from "next/server";
import { supabaseFetchJson } from "@/lib/supabaseRest";

function getDeviceId(request) {
  const { searchParams } = new URL(request.url);
  return searchParams.get("device_id") || process.env.NEXT_PUBLIC_DEVICE_ID || "";
}

export async function GET(request) {
  const deviceId = getDeviceId(request);
  if (!deviceId) return NextResponse.json({ error: "device_id wajib" }, { status: 400 });

  const { ok, status, data, error } = await supabaseFetchJson("/live_sensor", {
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

