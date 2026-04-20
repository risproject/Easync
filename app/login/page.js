"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Muat email dari localStorage saat pertama kali buka halaman
    useEffect(() => {
        const savedEmail = localStorage.getItem("rememberedEmail");
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Logika "Ingat Saya"
            if (rememberMe) {
                localStorage.setItem("rememberedEmail", email);
            } else {
                localStorage.removeItem("rememberedEmail");
            }
            router.replace("/");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 text-center">
            {/* Card untuk desktop */}
            <div className="hidden md:block w-full max-w-sm rounded-2xl bg-white shadow-lg p-6">
                <div className="mb-6">
                    <img src="/assets/f-s.png" alt="Logo" className="mx-auto mb-2 w-8 h-8 object-contain" />
                    <h1 className="text-lg font-semibold text-slate-900">Eferes easy-sync</h1>
                    <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 text-left">
                    <div>
                        <label htmlFor="email-desktop" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            id="email-desktop"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label htmlFor="password-desktop" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            id="password-desktop"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="remember-desktop"
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <label htmlFor="remember-desktop" className="text-sm font-medium text-slate-600 cursor-pointer select-none">
                            Ingat Saya
                        </label>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>

            {/* Tanpa card untuk mobile */}
            <div className="block md:hidden w-full px-1">
                <div className="mb-6">
                    <img src="/assets/f-s.png" alt="Logo" className="mx-auto mb-2 w-8 h-8 object-contain" />
                    <h1 className="text-lg font-semibold text-slate-900">Eferes easy-sync</h1>
                    <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 text-left">
                    <div>
                        <label htmlFor="email-mobile" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            id="email-mobile"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label htmlFor="password-mobile" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            id="password-mobile"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="remember-mobile"
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <label htmlFor="remember-mobile" className="text-sm font-medium text-slate-600 cursor-pointer select-none">
                            Ingat Saya
                        </label>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}
