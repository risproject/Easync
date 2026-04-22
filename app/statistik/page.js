"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useSensorLogsApi } from "../hook/useApiDevice";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import {
  FaChartBar, FaSeedling, FaXmark
} from "react-icons/fa6";
import { useSensorConfig } from "../utils/sensorUtils";
import LoadingScreen from "../component/LoadingScreen";

const num = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);

const formatK = (val) => {
  const n = Number(val);
  if (isNaN(n)) return val;
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return n;
};



const formatTs = (ts, rangeHours = 0) => {
  if (!ts) return "-";
  const dateObj = new Date(ts);
  if (isNaN(dateObj.getTime())) return ts;

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const mins = String(dateObj.getMinutes()).padStart(2, "0");

  return rangeHours > 24 ? `${hours}:${mins} ${day}/${month}` : `${hours}:${mins}`;
};



export default function StatistikPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID || "device-001";

  // state
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [selectedHours, setSelectedHours] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // api hook
  const { logs: sensorLogs, loading: logsLoading } = useSensorLogsApi(deviceId, { hours: selectedHours });
  const sensorConfig = useSensorConfig();

  // Derivasi sensorList dari sensorConfig dinamis
  const sensorList = useMemo(() => {
    if (!sensorConfig) return [];
    return Object.entries(sensorConfig).map(([key, value]) => ({ key, ...value }));
  }, [sensorConfig]);

  // rute login
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  // Load preferensi awal dari LocalStorage
  useEffect(() => {
    const keys = localStorage.getItem("pref_keys");
    if (keys) {
      try {
        const parsed = JSON.parse(keys);
        if (Array.isArray(parsed) && parsed.length > 0) setSelectedKeys(parsed);
      } catch (e) { console.error("Gagal load preferensi sensor", e); }
    }
    const hours = localStorage.getItem("pref_hours");
    if (hours !== null) {
      try {
        const parsed = JSON.parse(hours);
        if (parsed !== null && parsed !== undefined) setSelectedHours(parsed);
      } catch (e) { console.error("Gagal load preferensi waktu", e); }
    }
  }, []);

  // Simpan preferensi ke LocalStorage
  useEffect(() => {
    localStorage.setItem("pref_keys", JSON.stringify(selectedKeys));
  }, [selectedKeys]);

  useEffect(() => {
    localStorage.setItem("pref_hours", JSON.stringify(selectedHours));
  }, [selectedHours]);



  // Kunci scroll halaman saat Modal terbuka
  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isFilterOpen]);

  const toggleKey = (key) => {
    setSelectedKeys((prev) => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      return [...prev, key];
    });
  };

  const chartData = useMemo(() => {
    if (!sensorLogs) return [];
    return [...sensorLogs].reverse().map(log => ({
      time: formatTs(log.sensor_ts, selectedHours),
      ...log
    }));
  }, [sensorLogs, selectedHours]);

  const sensorStats = useMemo(() => {
    if (!sensorLogs || sensorLogs.length === 0 || !sensorList.length) return null;
    const stats = {};
    sensorList.forEach(cfg => {
      const values = sensorLogs.map(log => num(log[cfg.key], null)).filter(v => v !== null && v !== 0);
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        stats[cfg.key] = {
          min: Math.min(...values).toFixed(0),
          max: Math.max(...values).toFixed(0),
          avg: (sum / values.length).toFixed(0),
          rawMin: Math.min(...values),
          rawMax: Math.max(...values),
          rawAvg: sum / values.length
        };
      }
    });
    return stats;
  }, [sensorLogs]);


  // loading screen
  if (authLoading || (logsLoading && !sensorLogs)) return <LoadingScreen />;
  if (!user) return null;

  // bagian utama
  return (
    <div className="p-6 text-slate-800 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 my-3">
        <div className="">
          <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-linear-to-r from-teal-500 to-teal-600 text-white cursor-pointer text-sm rounded-lg shadow-sm">
            <FaChartBar size={14} />
            Filter Data
          </button>
        </div>
      </div>

      {/* --- KOLOM LAYOUT --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* panel grafik */}
        <div className="xl:col-span-2 flex flex-col">
          <div className="bg-white shadow-md rounded-xl border border-slate-300 overflow-hidden">
            <div className="p-4 flex flex-col justify-center">
              <h2 className="text-slate-700 font-bold text-xl">Grafik Historis</h2>
              <p className="text-slate-500 text-sm mb-3">
                {selectedHours
                  ? `Data ${selectedHours === 72 ? '3 Hari' : `${selectedHours} Jam`} Terakhir`
                  : "Data Terbaru"}
              </p>

              {/* Legenda */}
              {selectedKeys.length > 0 && (
                <div className="flex flex-wrap items-center gap-4">
                  {selectedKeys.map(key => {
                    const s = sensorConfig?.[key];
                    if (!s) return null;
                    return (
                      <div key={key} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4">
              {isFilterOpen && (
                <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
                  {/* Latar Belakang Gelap (Klik untuk tutup) */}
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />

                  {/* Kotak Modal Utama */}
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-xs overflow-hidden relative">

                    {/* Modal Header */}
                    <div className="px-5 py-4 flex justify-between items-center bg-slate-50/80">
                      <h3 className="font-bold text-slate-700">Filter Data</h3>
                      <button onClick={() => setIsFilterOpen(false)} className="text-white bg-red-500 hover:bg-red-600 cursor-pointer p-1.5 rounded-lg transition-colors shadow-sm">
                        <FaXmark size={16} />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div style={{ maxHeight: '75vh' }} className="px-5 flex flex-col overflow-y-auto">
                      {/* Filter Waktu */}
                      <div className="py-4 border-b border-slate-100 flex flex-col gap-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Filter Waktu</h4>

                        <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                          <input type="radio" name="timeFilter" className="w-4 h-4 accent-teal-600"
                            checked={selectedHours === 2}
                            onChange={() => setSelectedHours(2)}
                          />
                          2 Jam yang lalu
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                          <input type="radio" name="timeFilter" className="w-4 h-4 accent-teal-600"
                            checked={selectedHours === 12}
                            onChange={() => setSelectedHours(12)}
                          />
                          12 Jam yang lalu
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                          <input type="radio" name="timeFilter" className="w-4 h-4 accent-teal-600"
                            checked={selectedHours === 24}
                            onChange={() => setSelectedHours(24)}
                          />
                          24 Jam yang lalu
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                          <input type="radio" name="timeFilter" className="w-4 h-4 accent-teal-600"
                            checked={selectedHours === 72}
                            onChange={() => setSelectedHours(72)}
                          />
                          3 Hari yang lalu
                        </label>
                      </div>

                      {/* Filter Sensor */}
                      <div className="py-4 flex flex-col gap-4 mb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Pilih Sensor</h4>
                        {sensorList.map(s => (
                          <label key={s.key} className="flex items-center gap-3 cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-teal-600" checked={selectedKeys.includes(s.key)} onChange={() => toggleKey(s.key)} />
                            {s.label}
                          </label>
                        ))}
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* Area Grafik */}
              <div style={{ height: '350px' }} className="w-full mt-6">
                {logsLoading ? (
                  <div className="flex items-center justify-center h-full text-slate-500">Memuat data...</div>
                ) : chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500">Belum ada data log</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        {selectedKeys.map(key => {
                          const s = sensorConfig?.[key];
                          return (
                            <linearGradient key={`grad-${key}`} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={s?.color} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={s?.color} stopOpacity={0} />
                            </linearGradient>
                          );
                        })}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tickFormatter={formatK} tick={{ fill: '#94a3b8', fontSize: 12 }} width={35} dx={5} hide={!selectedKeys.includes('lux')} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value, name) => {
                          if (name === "Intensitas Cahaya") return [formatK(value), name];
                          return [value, name];
                        }}
                      />
                      {selectedKeys.map(key => {
                        const s = sensorConfig?.[key];
                        return (
                          <Area key={key} yAxisId={key === 'lux' ? "right" : "left"} type="monotone" dataKey={key} name={s?.label} stroke={s?.color} strokeWidth={2} fillOpacity={1} fill={`url(#color-${key})`} />
                        );
                      })}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RINGKASAN */}
        <div className="xl:col-span-1">
          <div className="bg-linear-to-r from-teal-500 to-teal-600 text-white rounded-xl shadow-sm border border-slate-300 overflow-hidden sticky top-20">
            <div className="h-20 relative px-4 flex flex-col justify-center">
              <FaSeedling className="text-white opacity-20 absolute top-1/2 -translate-y-1/2 right-4" size={60} />
              <h2 className="text-white font-bold text-xl relative z-10">Ringkasan</h2>
              <p className="text-white/70 text-sm relative z-10">
                {selectedHours
                  ? `${selectedHours === 72 ? '3 Hari' : `${selectedHours} Jam`} Terakhir`
                  : "Terbaru"}
              </p>
            </div>

            <div className="space-y-3 p-4">
              {(!sensorStats || Object.keys(sensorStats).length === 0 || !sensorConfig) ? (
                <div className="text-slate-500 text-md text-center py-4 italic">Belum ada data statistik</div>
              ) : (
                selectedKeys.map(key => {
                  const s = sensorConfig[key];
                  if (!s || !sensorStats[key]) return null;
                  const stats = sensorStats[key];
                  const maxLimit = s.maxLimit || 100;
                  const Icon = s.icon;

                  return (
                    <div key={key} className="bg-white/75 rounded-xl p-4 border border-slate-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/70 rounded-xl shadow-sm border border-slate-100" style={{ color: s.color }}>
                            {Icon && <Icon size={14} />}
                          </div>

                          <h3 className="text-sm font-bold text-slate-700 tracking-tight">{s.label}</h3>
                        </div>
                      </div>

                      <div className="mt-4">
                        {/* Baris Tertinggi */}
                        <div className="mt-3">
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-sm text-slate-500 font-medium tracking-tight">Tertinggi</span>
                            <span className="text-sm font-bold text-slate-700">{formatK(stats.max)}{s.unit}</span>
                          </div>
                          <div className="w-full bg-white/70 rounded-full h-2">
                            <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${Math.min((stats.rawMax / maxLimit) * 100, 100)}%`, backgroundColor: s.color }} />
                          </div>
                        </div>

                        {/* Baris Rata-rata */}
                        <div className="mt-3">
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-sm text-slate-500 font-medium tracking-tight">Rata-rata</span>
                            <span className="text-sm font-bold text-slate-700">{formatK(stats.avg)}{s.unit}</span>
                          </div>
                          <div className="w-full bg-white/70 rounded-full h-2">
                            <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${Math.min((stats.rawAvg / maxLimit) * 100, 100)}%`, backgroundColor: s.color }} />
                          </div>
                        </div>

                        {/* Baris Terendah */}
                        <div className="mt-3">
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-sm text-slate-500 font-medium tracking-tight">Terendah</span>
                            <span className="text-sm font-bold text-slate-700">{formatK(stats.min)}{s.unit}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${Math.min((stats.rawMin / maxLimit) * 100, 100)}%`, backgroundColor: s.color }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}