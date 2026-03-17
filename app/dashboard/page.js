"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Grafik from "../component/grafik";
import Kartu from "../component/kartu";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) router.replace("/login");
    }, [user, loading, router]);

    if (loading) return <p className="p-6">Loading...</p>;
    if (!user) return null;

    return (
        <div className="p-6 space-y-6">
            <Grafik />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Kartu />
            </div>
        </div>
    );
}
