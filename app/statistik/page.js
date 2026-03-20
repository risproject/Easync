"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  useLiveSensorApi,
  useSensorLogsApi,
  useAutomationApi,
} from "../hook/useApiDevice";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import {
  FaCircleCheck, FaChartBar, FaLeaf, FaClock, FaSeedling, FaXmark, FaChevronDown
} from "react-icons/fa6";

const num = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);
const avg = (a, b) => {
  const aVal = num(a, null);
  const bVal = num(b, null);
  if (aVal !== null && bVal !== null) return (aVal + bVal) / 2;
  return aVal ?? bVal ?? 0;
};

const formatTs = (ts, rangeHours = 0) => {
  if (!ts) return "-";
  // Now that firmware sends true UTC, we can use standard JS parsing
  const dateObj = new Date(ts);
  if (isNaN(dateObj.getTime())) return ts;

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const mins = String(dateObj.getMinutes()).padStart(2, "0");

  if (rangeHours > 48) {
    return `${day}/${month}`;
  }
  return `${hours}:${mins}`;
};

// --- KONFIGURASI SENSOR ---
// Semua pengaturan sensor di satu tempat agar mudah ditambah/kurangi.
const SENSOR_CONFIG = [
  { key: "soil_moisture1", label: "Soil Moist 1", unit: "%", icon: <FaSeedling size={14} />, color: "#0d9488", maxLimit: 100 },
  { key: "soil_moisture2", label: "Soil Moist 2", unit: "%", icon: <FaSeedling size={14} />, color: "#14b8a6", maxLimit: 100 },
  { key: "air_hum", label: "Air Hum", unit: "%", icon: <FaClock size={14} />, color: "#3b82f6", maxLimit: 100 },
  { key: "air_temp", label: "Air Temp", unit: "°C", icon: <FaClock size={14} />, color: "#3b82f6", maxLimit: 50 },
  { key: "temp1", label: "Temp 1", unit: "°C", icon: <FaClock size={14} />, color: "#8b5cf6", maxLimit: 50 },
  { key: "temp2", label: "Temp 2", unit: "°C", icon: <FaClock size={14} />, color: "#a855f7", maxLimit: 50 },
  { key: "lux", label: "Lux", unit: " Lux", icon: <FaLeaf size={14} />, color: "#f59e0b", maxLimit: 5000 },
  { key: "tds", label: "TDS", unit: " ppm", icon: <FaCircleCheck size={14} />, color: "#ef4444", maxLimit: 1000 },
];

export default function StatistikPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID || "device-001";

  // 1. Inisialisasi State & API
  const [selectedKeys, setSelectedKeys] = useState(["soil_moisture1", "soil_moisture2"]);
  const [selectedHours, setSelectedHours] = useState(12);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const { automation } = useAutomationApi(deviceId, { pollMs: 0 });
  const liveEnabled = automation?.live_enable === true;

  const { sensor } = useLiveSensorApi(deviceId, { pollMs: 2000, liveEnabled });
  const { logs: sensorLogs, loading: logsLoading } = useSensorLogsApi(deviceId, { hours: selectedHours });

  // 2. Proteksi & Pengaturan Browser (LocalStorage)
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    // Ambil pilihan terakhir user agar tidak reset saat refresh
    const hours = localStorage.getItem("pref_hours");
    const keys = localStorage.getItem("pref_keys");
    if (hours) setSelectedHours(Number(hours));
    if (keys) {
      try {
        const parsed = JSON.parse(keys);
        if (Array.isArray(parsed) && parsed.length > 0) setSelectedKeys(parsed);
      } catch (e) { console.error("Gagal load preferensi", e); }
    }
  }, []);

  useEffect(() => {
    // Simpan pilihan user setiap kali berubah
    localStorage.setItem("pref_hours", selectedHours);
    localStorage.setItem("pref_keys", JSON.stringify(selectedKeys));
  }, [selectedHours, selectedKeys]);

  // 3. Logika Pendukung (Online Status & Toggle Sensor)
  useEffect(() => {
    const latestLogTs = sensorLogs?.[0]?.sensor_ts;
    if (latestLogTs) {
      const diffMin = (new Date().getTime() - new Date(latestLogTs).getTime()) / (1000 * 60);
      setIsOnline(diffMin < 6 && diffMin >= -1);
    } else {
      setIsOnline(false);
    }
  }, [sensorLogs]);

  const toggleKey = (key) => {
    const isExist = selectedKeys.includes(key);
    if (isExist) {
      if (selectedKeys.length > 1) setSelectedKeys(selectedKeys.filter(k => k !== key));
    } else {
      if (selectedKeys.length >= 3) {
        setSelectedKeys([...selectedKeys.slice(1), key]); // Anti tumpuk, ganti yang lama
      } else {
        setSelectedKeys([...selectedKeys, key]);
      }
    }
  };

  // 4. Pengolahan Data untuk Grafik & Statistik
  // Data grafik: diurutkan dari yang terlama ke terbaru agar garisnya benar
  const chartData = useMemo(() => {
    if (!sensorLogs) return [];
    return [...sensorLogs].reverse().map(log => ({
      time: formatTs(log.sensor_ts, selectedHours),
      ...log // Menyertakan semua nilai sensor langsung
    }));
  }, [sensorLogs, selectedHours]);

  // Statistik Ringkasan: Hitung Tertinggi, Terendah, dan Rata-rata
  const sensorStats = useMemo(() => {
    if (!sensorLogs || sensorLogs.length === 0) return null;

    const stats = {};
    SENSOR_CONFIG.forEach(cfg => {
      const values = sensorLogs.map(log => num(log[cfg.key], null)).filter(v => v !== null && v !== 0);
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        stats[cfg.key] = {
          min: Math.min(...values).toFixed(0),
          max: Math.max(...values).toFixed(0),
          avg: (sum / values.length).toFixed(0)
        };
      }
    });
    return stats;
  }, [sensorLogs]);

  if (authLoading) return <div className="p-10 font-medium text-slate-500 text-center">Memeriksa akun...</div>;
  if (!user) return null;

  return (
    <div className="p-4 md:p-6 text-slate-800 min-h-screen pb-20">

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isOnline ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {isOnline ? "Online" : "Offline"}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${liveEnabled ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-700"}`}>
              {liveEnabled ? "Live" : "Sleep"}
            </span>
            <span>• {deviceId}</span>
          </div>
        </div>
        <div className="relative group">
          <select
            value={selectedHours}
            onChange={(e) => setSelectedHours(Number(e.target.value))}
            className="appearance-none bg-white border border-slate-200 pl-10 pr-10 py-2 rounded-2xl text-sm font-medium shadow-sm hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-50 transition-all cursor-pointer text-slate-700"
          >
            <option value={2}>2 Jam Terakhir</option>
            <option value={12}>12 Jam Terakhir</option>
            <option value={72}>3 Hari Terakhir</option>
            <option value={168}>7 Hari Terakhir</option>
            <option value={336}>14 Hari Terakhir</option>
          </select>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover:text-teal-500 transition-colors">
            <FaChartBar />
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover:text-teal-500 transition-colors">
            <FaChevronDown size={12} />
          </div>
        </div>
      </div>

      {/* --- LAYOUT UTAMA --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* KOLOM KIRI: GRAFIK & LOG */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          <div className="bg-white shadow-md rounded-2xl p-3 md:p-6 border border-black/10">
            <div className="flex flex-col mb-6 relative">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-700">Grafik Pembacaan Sensor</h2>
                  <p className="text-sm text-slate-500">Pilih maksimal 3 data</p>
                </div>
              </div>

              {/* CUSTOM MULTI-SELECT UI */}
              <div className="relative">
                {isDropdownOpen && (
                  <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                )}

                <div className={`w-full border ${isDropdownOpen ? 'border-teal-500 ring-2 ring-teal-50' : 'border-slate-300'} rounded-2xl flex items-center justify-between px-1.5 py-1.5 cursor-pointer shadow-sm transition-all relative z-20`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                  <div className="flex flex-wrap gap-2 items-center flex-1">
                    {selectedKeys.length === 0 ? (
                      <span className="text-sm text-slate-500 ml-1">Pilih data sensor...</span>
                    ) : (
                      selectedKeys.map((key) => {
                        const s = SENSOR_CONFIG.find(x => x.key === key);
                        if (!s) return null;
                        return (
                          <span key={s.key} className="flex items-center px-3 py-2 rounded-xl text-white text-xs font-medium shadow-sm" style={{ backgroundColor: s.color }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleKey(s.key);
                            }}
                          >
                            {s.label}
                            <div className="hover:bg-black/20 rounded-full p-0.5 ml-1 transition-colors flex items-center justify-center">
                              <FaXmark size={12} />
                            </div>
                          </span>
                        );
                      })
                    )}
                  </div>
                  <div className="pl-2 text-slate-500 border-l border-slate-200 ml-2">
                    <FaChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-teal-500" : ""}`} />
                  </div>
                </div>

                {/* DROPDOWN MENU */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-30 py-2 max-h-64 overflow-y-auto w-full">
                    {SENSOR_CONFIG.map(s => {
                      const isSelected = selectedKeys.includes(s.key);
                      return (
                        <div
                          key={s.key}
                          className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors ${isSelected ? "bg-slate-50 font-medium text-slate-800" : "text-slate-600"}`}
                          onClick={() => {
                            toggleKey(s.key);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></span>
                            {s.label}
                          </div>
                          {isSelected && <FaCircleCheck className="text-emerald-500" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="h-[300px] md:h-[400px] w-full mt-4">
              {logsLoading ? (
                <div className="flex items-center justify-center h-full text-slate-500">Memuat data...</div>
              ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500">Belum ada data log</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <defs>
                      {selectedKeys.map(key => {
                        const sensorDef = SENSOR_CONFIG.find(s => s.key === key);
                        return (
                          <linearGradient key={`grad-${key}`} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={sensorDef?.color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={sensorDef?.color} stopOpacity={0} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    {selectedKeys.map(key => {
                      const sensorDef = SENSOR_CONFIG.find(s => s.key === key);
                      return (
                        <Area
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={sensorDef?.label}
                          stroke={sensorDef?.color}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill={`url(#color-${key})`}
                        />
                      );
                    })}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN RINGKASAN */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-20">

            <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600 relative p-6 flex flex-col justify-end">
              <FaSeedling className="text-white opacity-20 absolute top-4 right-4" size={80} />
              <h2 className="text-white font-bold text-xl relative z-10">Ringkasan</h2>
              <p className="text-emerald-100 text-sm relative z-10">
                {selectedHours === 2 && "2 Jam Terakhir"}
                {selectedHours === 12 && "12 Jam Terakhir"}
                {selectedHours === 72 && "3 Hari Terakhir"}
                {selectedHours === 168 && "7 Hari Terakhir"}
                {selectedHours === 336 && "14 Hari Terakhir"}
              </p>
            </div>

            {/* Ringkasan Statistik Detail */}
            <div className="space-y-4 mb-4">
              {sensorStats ? (
                selectedKeys.map(key => {
                  const s = SENSOR_CONFIG.find(x => x.key === key);
                  if (!s || !sensorStats[key]) return null;
                  return (
                    <StatDetailCard
                      key={key}
                      title={s.label}
                      unit={s.unit}
                      icon={s.icon}
                      stats={sensorStats[key]}
                      color={s.color}
                      maxLimit={s.maxLimit}
                    />
                  );
                })
              ) : (
                <div className="text-slate-500 text-md text-center py-4 italic">Belum ada data statistik</div>
              )}
            </div>
            <hr className="border-slate-100 my-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatDetailCard({ title, unit, icon, stats, color, maxLimit = 100 }) {
  const Row = ({ label, value }) => (
    <div className="mt-3">
      <div className="flex justify-between items-end mb-1">
        <span className="text-sm text-slate-500 font-medium tracking-tight">{label}</span>
        <span className="text-sm font-bold text-slate-700">{value}{unit}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{
            width: `${Math.min((value / maxLimit) * 100, 100)}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:border-emerald-200 transition-colors group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100" style={{ color: color }}>
            {icon}
          </div>
          <h3 className="text-sm font-bold text-slate-700 tracking-tight">{title}</h3>
        </div>
        <FaChevronDown size={10} className="text-slate-500 -rotate-90" />
      </div>

      <div className="mt-4">
        <Row label="Tertinggi" value={stats.max} />
        <Row label="Rata-rata" value={stats.avg} />
        <Row label="Terendah" value={stats.min} />
      </div>
    </div>
  );
}

function StatCard({ title, value, status, statusColor, icon, borderColor }) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</h3>
          <div className="text-3xl font-bold text-slate-800 mb-2">{value}</div>
          <p className={`text-xs font-medium ${statusColor}`}>{status}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
}