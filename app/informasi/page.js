"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useSensorLogsApi, useRelayLogsApi } from "../hook/useApiDevice";
import LoadingScreen from "../component/LoadingScreen";
import { FaClock, FaCheck, FaPowerOff } from "react-icons/fa6";
import { TbWaveSawTool } from "react-icons/tb";

const formatFullTs = (ts) => {
  if (!ts) return "-";
  const dateObj = new Date(ts);
  if (isNaN(dateObj.getTime())) return ts;

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const mins = String(dateObj.getMinutes()).padStart(2, "0");
  const secs = String(dateObj.getSeconds()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${mins}:${secs}`;
};

export default function InformasiPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID;

  // Ambil data log sensor dan relay
  const { logs: sensorLogs, loading: sensorLoading } = useSensorLogsApi(deviceId, { limit: 20 });
  const { logs: relayLogs, loading: relayLoading } = useRelayLogsApi(deviceId, { limit: 20 });

  const logsLoading = sensorLoading || relayLoading;
  const allLogs = useMemo(() => {
    const combined = [];

    // Log Sensor
    if (sensorLogs) {
      sensorLogs.forEach(log => {
        combined.push({
          ts: log.sensor_ts,
          type: "sensor",
          title: "Data Sensor Dikirim",
          icon: <TbWaveSawTool size={20} />,
          colorClass: "bg-sky-200 text-sky-700",
        });
      });
    }
    if (relayLogs) {
      const relayNames = { relay1: "Relay 1", relay2: "Relay 2", relay3: "Relay 3", relay4: "Relay 4" };
      relayLogs.forEach((log, i) => {
        const prev = relayLogs[i + 1];
        Object.keys(relayNames).forEach(key => {
          const currentVal = log[key];
          const prevVal = prev ? prev[key] : null;
          if (prevVal === null || currentVal !== prevVal) {
            const isOn = currentVal === true || currentVal > 0;
            combined.push({
              ts: log.ts,
              type: "relay",
              title: `${relayNames[key]} telah di ${isOn ? "NYALAKAN" : "MATIKAN"}`,
              icon: isOn ? <FaCheck size={18} /> : <FaPowerOff size={18} />,
              colorClass: isOn
                ? "bg-emerald-200 text-emerald-700"
                : "bg-red-200 text-red-700",
              statusType: isOn ? "ON" : "OFF"
            });
          }
        });
      });
    }

    // Urutkan dari yang terbaru
    return combined.sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 20);
  }, [sensorLogs, relayLogs]);

  // redirect ke login
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  if (authLoading || (logsLoading && allLogs.length === 0)) return <LoadingScreen />;
  if (!user) return null;

  return (
    <div className="p-6 text-slate-700 min-h-screen pb-20">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-700">Log Aktivitas Sistem</h1>
        <p className="text-sm text-slate-500 mt-1 tracking-wider font-medium">Halaman Informasi & Riwayat Perangkat</p>
      </div>

      {!logsLoading && allLogs.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
            Terdeteksi {allLogs.length} Aktivitas Terbaru
          </p>
        </div>
      )}

      <div className="space-y-4 text-slate-800">
        {logsLoading ? (
          <div className="p-10 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-100 shadow-sm">
            Memuat data log...
          </div>
        ) : allLogs.length === 0 ? (
          <div className="p-10 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-100 shadow-sm">
            Belum ada riwayat aktivitas ditemukan.
          </div>
        ) : (
          allLogs.map((log, idx) => (
            <div
              key={idx}
              className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-4"
            >
              <div className={`mt-1 p-2 rounded-xl shrink-0 ${log.colorClass}`}>
                {log.icon}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-slate-700 text-md">
                    {log.title}
                  </p>
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg uppercase ${log.type === "sensor" ? "bg-slate-100 text-slate-500" :
                    log.statusType === "ON" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    }`}>
                    {log.type === "sensor" ? "Laporan" : log.statusType}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium">
                    <FaClock size={12} className="text-slate-300" />
                    <span>{formatFullTs(log.ts)} WIB</span>
                  </div>
                  <span className="hidden md:block text-slate-200">|</span>
                  <div className="flex">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-100 text-slate-500">
                      {deviceId}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
