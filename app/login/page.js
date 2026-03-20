"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const loginGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            router.replace("/"); // redirect ke dashboard
        } catch (err) {
            console.error(err);
            alert("Login gagal: " + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 text-center">
            {/* Card untuk desktop */}
            <div className="hidden md:block w-full max-w-sm rounded-2xl bg-white shadow-lg p-6">
                <div className="mb-4">
                    <img src="/assets/f-s.png" alt="Logo" className="mx-auto mb-2 w-8 h-8 object-contain" />
                    <h1 className="text-lg font-semibold text-slate-900">Eferes easy-sync</h1>
                    <p className="text-sm text-slate-600">Sign in with your Google account</p>
                </div>
                <button
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                    onClick={loginGoogle}
                >
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-white text-blue-600 text-xs font-bold">G</span>
                    Sign-in
                </button>
            </div>

            {/* Tanpa card untuk mobile */}
            <div className="block md:hidden w-full px-1">
                <div className="mb-4">
                    <img src="/assets/f-s.png" alt="Logo" className="mx-auto mb-2 w-8 h-8 object-contain" />
                    <h1 className="text-lg font-semibold text-slate-900">Eferes easy-sync</h1>
                </div>
                <p className="mb-3 text-sm text-slate-600">Sign in with your Google account</p>
                <button
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                    onClick={loginGoogle}
                >
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-white text-blue-600 text-xs font-bold">G</span>
                    Sign-in
                </button>
            </div>
        </div>
    );
}

