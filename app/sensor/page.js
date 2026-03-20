"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Kartu from "../component/kartu";

/**
 * Halaman Sensor Dashboard
 * Menampilkan ringkasan data sensor secara visual menggunakan Kartu Indikator.
 */
export default function SensorPage() {
  // --- 1. OTENTIKASI & KEAMANAN ---
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Pental (redirect) ke login jika user tidak terdeteksi
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Tampilan standby saat memverifikasi akses
  if (authLoading) {
    return (
      <div className="p-10 text-slate-400 italic">
        Menghubungkan ke pusat data...
      </div>
    );
  }

  // Jika tidak ada user, jangan render apa-apa (akan diarahkan oleh useEffect)
  if (!user) return null;

  return (
    <div className="p-6 text-slate-800 min-h-screen pb-20 bg-slate-50/30">
      
      {/* --- 2. HEADER DASHBOARD --- */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Status Perangkat</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium italic">
          Kondisi lingkungan real-time dari sensor lapangan.
        </p>
      </div>

      {/* --- 3. DAFTAR KARTU INDIKATOR --- */}
      {/* 
          Grid responsif: 
          - 1 Kolom di HP
          - 2 Kolom di Tablet
          - Minimal 3-4 Kolom di Desktop 
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
        <Kartu />
      </div>

      {/* Footer bantuan / tips sederhana */}
      <div className="mt-12 p-5 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
        <p className="text-xs text-slate-400 font-medium italic">
          Data di atas diperbarui setiap beberapa detik secara otomatis.
        </p>
      </div>

    </div>
  );
}
