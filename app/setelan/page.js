"use client";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function SetelanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/login");
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  };

  if (loading) return <div className="p-10 text-slate-500">Memuat...</div>;
  if (!user) return null;

  return (
    <div className="p-8 space-y-6 text-slate-800">
      <h1 className="text-2xl font-bold">Setelan</h1>

      <div>
        <p className="text-sm font-medium text-slate-700">Alamat Email :</p>
        <p className="text-sm font-medium text-slate-700">{user.email}</p>
      </div>

      <button
        onClick={handleLogout}
        className="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
}
