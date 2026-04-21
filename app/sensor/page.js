"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLiveSensorApi } from "../hook/useApiDevice";
import { formatTimestamp } from "../utils/sensorUtils";
import Kartu from "../component/kartu";
import LoadingScreen from "../component/LoadingScreen";

export default function SensorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID || "device-001";
  const { sensor } = useLiveSensorApi(deviceId);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // loading info
  if (authLoading) {
    return <LoadingScreen />;
  }
  if (!user) return null;

  return (
    <div className="p-6 text-slate-700 min-h-screen pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-700 tracking-tight">Data Sensor</h1>
        <p className="text-sm text-slate-500 mt-2 font-medium ">
          Sinkronisasi Terakhir : {sensor?.sensor_ts ? formatTimestamp(sensor.sensor_ts) : "-"}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
        <Kartu sensor={sensor} />
      </div>

    </div>
  );
}
