"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash, FaSeedling } from "react-icons/fa6";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Muat email & password dari localStorage
    useEffect(() => {
        const savedEmail = localStorage.getItem("rememberedEmail");
        const savedPassword = localStorage.getItem("rememberedPassword");
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
        if (savedPassword) {
            setPassword(savedPassword);
        }
    }, []);

    async function handleLogin(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else {
            if (rememberMe) {
                localStorage.setItem("rememberedEmail", email);
                localStorage.setItem("rememberedPassword", password);
            } else {
                localStorage.removeItem("rememberedEmail");
                localStorage.removeItem("rememberedPassword");
            }
            router.replace("/");
        }
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-6">
            <div className="w-full max-w-sm">

                <div className="mb-6 text-center text-teal-600 flex flex-col items-center">
                    <FaSeedling size={32} className="mb-2" />
                    <h1 className="text-lg font-semibold text-slate-700">Easync</h1>
                    <p className="text-sm text-slate-500 mt-1">Login untuk masuk ke Easync</p>
                </div>

                <div className="md:rounded-2xl md:bg-white md:shadow-lg md:p-6">
                    <form onSubmit={handleLogin} className="space-y-4 text-left">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@gmail.com" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors" />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <input id="password" placeholder="••••••••" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors" />
                                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1} >
                                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Ingat Saya */}
                        <div className="flex items-center gap-2">
                            <input id="remember" type="checkbox" className="w-4 h-4 rounded border-slate-300 text-teal-600 accent-teal-600 focus:ring-teal-500 cursor-pointer" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer select-none">
                                Ingat Saya
                            </label>
                        </div>

                        {/* Pesan error */}
                        {error && (
                            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        {/* Tombol submit */}
                        <button type="submit" disabled={loading} className="w-full cursor-pointer rounded-lg bg-linear-to-r from-teal-500 to-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            {loading ? "Processing..." : "Log in"}
                        </button>

                    </form>
                </div>

            </div>
        </div>
    );
}
