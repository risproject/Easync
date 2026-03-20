"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function Header({ onPowerToggle }) {
    const { user } = useAuth();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClick = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        const handleKey = (event) => {
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        router.replace("/login");
    };

    const displayName = user?.displayName || "User";
    const email = user?.email || "-";

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-slate-200">
            <div className="w-full px-4 py-3 flex items-center gap-3">
                <div className="ml-auto flex items-center gap-3">
                    <div className="relative" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                        >
                            <span className="max-w-[140px] truncate">{displayName}</span>
                            <svg
                                viewBox="0 0 20 20"
                                className={`w-4 h-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z" />
                            </svg>
                        </button>

                        {open && (
                            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg">
                                <div className="px-4 py-3">
                                    <div className="text-sm font-semibold text-slate-900 truncate">{displayName}</div>
                                    <div className="text-xs text-slate-500 truncate">{email}</div>
                                </div>
                                <div className="border-t border-slate-100" />
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                                        <path d="M8.75 3.5a.75.75 0 0 1 .75-.75h4.25A2.75 2.75 0 0 1 16.5 5.5v9A2.75 2.75 0 0 1 13.75 17.25H9.5a.75.75 0 0 1 0-1.5h4.25c.69 0 1.25-.56 1.25-1.25v-9c0-.69-.56-1.25-1.25-1.25H9.5a.75.75 0 0 1-.75-.75z" />
                                        <path d="M3.22 10.53a.75.75 0 0 1 0-1.06l2.75-2.75a.75.75 0 1 1 1.06 1.06L5.56 9.25H12a.75.75 0 0 1 0 1.5H5.56l1.47 1.47a.75.75 0 1 1-1.06 1.06l-2.75-2.75z" />
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
