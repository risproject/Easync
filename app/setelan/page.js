"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { useAutomationApi } from "../hook/useApiDevice";
import { FiLogOut, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { formatTimestamp } from "../utils/sensorUtils";
import LoadingScreen from "../component/LoadingScreen";

export default function SetelanPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID || "device-001";

  const { automation, updateAutomation, refresh } = useAutomationApi(deviceId, { pollMs: 0 });

  const [formData, setFormData] = useState({
    soil_min: 0,
    soil_max: 0,
    duration_sec: 0,
    quiet_start: "00:00",
    quiet_end: "00:00",
    inspect_interval: 0,
    soil_fusion: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Sync animation data to local state
  useEffect(() => {
    if (automation) {
      setFormData({
        soil_min: automation.soil_min ?? 0,
        soil_max: automation.soil_max ?? 0,
        duration_sec: automation.duration_sec ?? 0,
        quiet_start: automation.quiet_start?.slice(0, 5) ?? "00:00",
        quiet_end: automation.quiet_end?.slice(0, 5) ?? "00:00",
        inspect_interval: automation.inspect_interval ?? 0,
        soil_fusion: automation.soil_fusion === true || automation.soil_fusion === "true"
      });
    }
  }, [automation]);

  // Kunci scroll saat modal terbuka
  useEffect(() => {
    if (saveStatus) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [saveStatus]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/login");
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSoilFusionSelect = async (e) => {
    const isTrue = e.target.value === "true";
    setFormData(prev => ({ ...prev, soil_fusion: isTrue }));
    try {
      await updateAutomation({ ...formData, soil_fusion: isTrue });
      setSaveStatus("success");
      refresh();
    } catch (err) {
      console.error("Soil Fusion error:", err);
      setSaveStatus("error");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await updateAutomation(formData);
      setSaveStatus("success");
      refresh();
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !automation) return <LoadingScreen />;
  if (!user) return null;

  return (
    <div className="p-6 text-slate-700 min-h-screen pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Setelan
        </h1>
        <p className="text-sm text-slate-500 mt-2 font-medium ">
          Sinkronisasi Terakhir : {automation?.applied_at ? formatTimestamp(automation.applied_at) : "-"}
        </p>
      </div>

      <form onSubmit={handleSave}>

        {saveStatus === "success" && (
          <div className="fixed inset-0 z-65 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[320px] p-5 relative flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-6">
                <FiCheckCircle size={48} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Berhasil!</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">Konfigurasi berhasil diterapkan</p>
              <button type="button" onClick={() => setSaveStatus(null)}
                className="w-full py-1.5 bg-linear-to-r from-teal-500 to-teal-600 text-white shadow-sm border border-slate-300 cursor-pointer rounded-lg hover:bg-slate-800">
                Selesai
              </button>
            </div>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="fixed inset-0 z-65 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[320px] p-5 relative flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                <FiXCircle size={48} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Gagal!</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">Terjadi kesalahan saat menyimpan pengaturan.</p>
              <button
                type="button"
                onClick={() => setSaveStatus(null)}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all cursor-pointer shadow-lg active:scale-95">
                Tutup
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Kolom Kiri: Info & Fusion */}
          <div className="space-y-4">
            <div className="p-6 rounded-xl border border-slate-300 bg-white">
              <p className="text-sm text-slate-500">Akun : </p>
              <p className="text-slate-700 font-medium mb-3">{user.email}</p>
              <p className="text-sm text-slate-500">Nomor Seri IoT : </p>
              <p className="text-slate-700 font-medium mb-3">{deviceId}</p>
              <button type="button" onClick={handleLogout}
                className=" px-4 py-1.5 mt-4 gap-2 flex items-center justify-center bg-red-50 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors cursor-pointer border border-red-200">
                <FiLogOut /> Logout
              </button>
            </div>

            <div className="p-6 rounded-xl border border-slate-300 bg-white">
              <div className="items-center justify-between flex">
                <h3 className="font-bold text-slate-700">Soil Fusion</h3>
                <select
                  value={formData.soil_fusion ? "true" : "false"}
                  onChange={handleSoilFusionSelect}
                  className="px-3 py-1 mb-3 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-teal-600 transition-all cursor-pointer">
                  <option value="false">Fusion OFF</option>
                  <option value="true">Fusion ON</option>
                </select>
              </div>
              <p className="text-sm text-slate-500">Gabungkan Pembacaan 2 Sensor Kelembapan Tanah Sekaligus</p>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-slate-300">
            <h3 className="font-bold text-slate-700 flex items-center gap-2 border-b border-slate-300 pb-2 mb-6">
              kelembapan Tanah Otomatis
            </h3>

            <div className="mb-10">
              {/* Slider Minimum */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-700 font-bold">Minimum</span>
                <span className="text-md font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded border border-teal-100">{formData.soil_min}%</span>
              </div>
              <input type="range" name="soil_min" min="0" max="100" value={formData.soil_min} onChange={handleChange} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 mb-4" />
              <div className="flex justify-between text-sm text-slate-500 font-medium px-1">
                <span>0%</span>
                <span>20%</span>
                <span>40%</span>
                <span>60%</span>
                <span>80%</span>
                <span>100%</span>
              </div>

              {/* Slider Maximum */}
              <div className="flex justify-between items-center mb-2 mt-10">
                <span className="text-sm text-slate-700 font-bold">Maximum</span>
                <span className="text-md font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded border border-teal-100">{formData.soil_max}%</span>
              </div>
              <input type="range" name="soil_max" min="0" max="100" value={formData.soil_max} onChange={handleChange} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 mb-4" />
              <div className="flex justify-between text-sm text-slate-500 font-medium px-1">
                <span>0%</span>
                <span>20%</span>
                <span>40%</span>
                <span>60%</span>
                <span>80%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Mulai Tunda</label>
                <input type="time" name="quiet_start" value={formData.quiet_start} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none transition-all" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Selesai Tunda</label>
                <input type="time" name="quiet_end" value={formData.quiet_end} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none transition-all" />
              </div>
            </div>

            <div className="mb-10">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">Durasi Siram</label>
                <span className="px-2 py-1 bg-teal-100 text-teal-700 text-md font-bold rounded-lg border border-teal-100">
                  {formData.duration_sec} Detik
                </span>
              </div>
              <input type="range" name="duration_sec" min="10" max="60" value={formData.duration_sec} onChange={handleChange} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 mb-4" />
              <div className="flex justify-between text-sm text-slate-500 font-medium px-1 mb-2">
                <span>10s</span>
                <span>20s</span>
                <span>30s</span>
                <span>40s</span>
                <span>50s</span>
                <span>60s</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">Lama pompa menyala otomatis saat terpicu.</p>
            </div>

            <div className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-slate-700">Interval Pengecekan</label>
                <span className="px-2 py-1 bg-teal-100 text-teal-700 text-md font-bold rounded-lg border border-teal-100">
                  {formData.inspect_interval} Menit
                </span>
              </div>
              <input type="range" name="inspect_interval" min="1" max="20" value={formData.inspect_interval} onChange={handleChange} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 mb-4" />
              <div className="flex justify-between text-sm text-slate-500 font-medium px-1 mb-2">
                <span>1m</span>
                <span>5m</span>
                <span>10m</span>
                <span>15m</span>
                <span>20m</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">Seberapa sering sistem mengecek data sensor.</p>
            </div>

            <button
              type="submit" disabled={isSaving}
              className={`w-full flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg transition-all ${isSaving
                ? "bg-slate-100 text-slate-500 cursor-wait"
                : "bg-linear-to-r from-teal-500 to-teal-600 text-white shadow-sm border border-slate-300 cursor-pointer"
                }`}>
              {isSaving && (
                <span className="h-4 w-4 border-2 border-slate-300 border-t-slate-500 animate-spin rounded-full" />
              )}
              {isSaving ? "Menerapkan..." : "Terapkan"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
