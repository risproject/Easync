"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../component/LoadingScreen";
import { PiPlantFill } from "react-icons/pi";
import Grafik from "../component/grafik";

const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID || "device-001";

function hitungUsia(tanggalTanam) {
  const tanam = new Date(tanggalTanam);
  const now = new Date();
  const diff = now - tanam;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function formatUsia(totalDays) {
  if (totalDays < 30) return `${totalDays} Hari`;
  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;
  if (days === 0) return `${months} Bulan`;
  return `${months} Bulan ${days} Hari`;
}

function tentukanFase(usia, batasVegetatif) {
  if (usia <= batasVegetatif) return { fase: "Vegetatif", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  return { fase: "Generatif", color: "bg-amber-100 text-amber-700 border-amber-200" };
}

export default function TanamankuPage() {
  const { user, loading: authLoading } = useAuth();
  const [plant, setPlant] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const fetchPlant = useCallback(async () => {
    try {
      const res = await fetch(`/api/plants?device_id=${deviceId}`);
      const json = await res.json();
      if (json.data) setPlant(json.data);
    } catch (err) {
      console.error("Fetch plant gagal:", err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchPlant();
  }, [fetchPlant]);

  if (authLoading || loadingData) return <LoadingScreen />;
  if (!user) return null;

  const usia = plant?.tanggal_tanam ? hitungUsia(plant.tanggal_tanam) : null;
  const faseInfo = usia !== null ? tentukanFase(usia, plant.batas_vegetatif) : null;

  return (
    <div className="p-6 text-slate-700 min-h-screen pb-20">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-slate-800 mb-1">
          Tanamanku
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Usia dan Fase Tanaman Saat Ini
        </p>
      </div>

      <div className="max-w-md mx-auto">
        {plant?.tanggal_tanam ? (
          <>
            <div className="rounded-xl border border-slate-300 bg-white overflow-hidden mb-10">
              <div className="bg-slate-100/80 text-center py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 text-lg mb-0.5">{plant.nama}</h3>
                <p className="text-xs text-slate-700 font-medium">
                  Ditanam : {new Date(plant.tanggal_tanam).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>

              <div className="p-6">
                <div className="flex justify-center my-6">
                  <PiPlantFill size={140} className="text-teal-600 drop-shadow-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="border border-teal-600 rounded-lg p-3 text-center flex flex-col justify-center">
                    <p className="text-xs text-teal-700 font-bold mb-1">Usia Tanaman</p>
                    <p className="text-sm font-bold text-teal-700">{formatUsia(usia)}</p>
                  </div>

                  <div className="bg-[#d4f7eb] rounded-lg p-3 text-center flex flex-col justify-center">
                    <p className="text-xs text-teal-700 font-bold mb-1">Fase saat ini</p>
                    <p className="text-sm font-bold text-teal-700">{faseInfo.fase}</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-6 text-center">
              Pengaturan tanaman dapat diubah di <a href="/setelan" className="text-teal-600 font-semibold hover:underline">Setelan</a>.
            </p>
          </>
        ) : (
          <div className="text-center py-10 px-6 rounded-xl border border-slate-300 bg-white text-slate-400 mb-6 mt-10">
            <PiPlantFill size={48} className="mx-auto mb-4 opacity-40 text-emerald-600" />
            <p className="font-medium text-slate-600">Belum ada data tanaman.</p>
            <p className="text-sm mt-1">Atur tanaman Anda di halaman <a href="/setelan" className="text-teal-600 font-semibold hover:underline">Setelan</a>.</p>
          </div>
        )}
      </div>
    </div>
  );
}
