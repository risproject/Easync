import { NextResponse } from "next/server";
import { supabaseFetchJson } from "@/lib/supabaseRest";

function getDeviceId(request) {
  const { searchParams } = new URL(request.url);
  return searchParams.get("device_id") || process.env.NEXT_PUBLIC_DEVICE_ID || "";
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const deviceId = getDeviceId(request);
  const limit = searchParams.get("limit") || "50";

  if (!deviceId) return NextResponse.json({ error: "device_id wajib" }, { status: 400 });

  const { ok, status, data, error } = await supabaseFetchJson("/activity_log", {
    params: {
      device_id: `eq.${deviceId}`,
      select: "*",
      order: "sensor_ts.desc",
      limit,
    },
    timeoutMs: 8000,
  });

  if (!ok) return NextResponse.json({ error }, { status });

  return NextResponse.json({ data: Array.isArray(data) ? data : [] });
}

