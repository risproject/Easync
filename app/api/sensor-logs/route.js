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
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  if (!deviceId) return NextResponse.json({ error: "device_id wajib" }, { status: 400 });

  const params = {
    device_id: `eq.${deviceId}`,
    select: "*",
    order: "sensor_ts.desc",
  };

  if (startDate && endDate) {
    params.and = `(sensor_ts.gte.${startDate},sensor_ts.lte.${endDate})`;
    params.limit = searchParams.get("limit") || "2000";
  } else if (hours) {
    const hoursNum = parseFloat(hours);
    if (!isNaN(hoursNum)) {
      // Use standard UTC comparison as firmware now sends true UTC
      const since = new Date(Date.now() - hoursNum * 60 * 60 * 1000).toISOString();
      params.sensor_ts = `gte.${since}`;
      // Set very high limit to effectively remove the row limit and rely fully on time filter
      params.limit = searchParams.get("limit") || "10000"; 
    }
  } else {
    params.limit = limit;
  }

  const targetLimit = parseInt(params.limit || limit, 10) || 10000;
  let allData = [];
  let currentOffset = 0;
  let fetchError = null;
  let errorStatus = 500;
  let loopCount = 0;
  const MAX_LOOPS = 8; // allows up to 8000 rows

  do {
    const loopParams = { ...params, limit: 1000, offset: currentOffset };
    const { ok, status, data, error } = await supabaseFetchJson("/sensor_logs", {
      params: loopParams,
      timeoutMs: 8000,
    });

    if (!ok) {
      if (currentOffset === 0) {
        fetchError = error;
        errorStatus = status;
      }
      break;
    }

    if (Array.isArray(data)) {
      allData = allData.concat(data);
      currentOffset += data.length;
      if (data.length < 1000) break; // Reached end of data
    } else {
      break;
    }
    loopCount++;
  } while (allData.length < targetLimit && loopCount < MAX_LOOPS);

  if (fetchError) return NextResponse.json({ error: fetchError }, { status: errorStatus });

  // Optional: slice to strictly match targetLimit if not time bounded
  if (allData.length > targetLimit) {
    allData = allData.slice(0, targetLimit);
  }

  return NextResponse.json({ data: allData });
}

