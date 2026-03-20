import { NextResponse } from "next/server";
import { supabaseFetchJson } from "../../../lib/supabaseRest";

function getDeviceId(request) {
  const { searchParams } = new URL(request.url);
  return searchParams.get("device_id") || process.env.NEXT_PUBLIC_DEVICE_ID || "";
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const deviceId = getDeviceId(request);
  const limit = searchParams.get("limit") || "50";
  const hours = searchParams.get("hours");

  if (!deviceId) return NextResponse.json({ error: "device_id wajib" }, { status: 400 });

  const params = {
    device_id: `eq.${deviceId}`,
    select: "*",
    order: "ts.desc",
  };

  if (hours) {
    const hoursNum = parseFloat(hours);
    if (!isNaN(hoursNum)) {
      const since = new Date(Date.now() - hoursNum * 60 * 60 * 1000).toISOString();
      params.ts = `gte.${since}`;
      params.limit = searchParams.get("limit") || "1000"; 
    }
  } else {
    params.limit = limit;
  }

  const { ok, status, data, error } = await supabaseFetchJson("/relay_logs", {
    params,
    timeoutMs: 8000,
  });

  if (!ok) return NextResponse.json({ error }, { status });

  return NextResponse.json({ data: Array.isArray(data) ? data : [] });
}

