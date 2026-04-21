"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Grafik from "../component/grafik";
import ControlPanel from "../component/controlPanel";
import LoadingScreen from "../component/LoadingScreen";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) router.replace("/login");
    }, [user, loading, router]);

    if (loading) return <LoadingScreen />;
    if (!user) return null;

    return (
        <div className="p-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Grafik />
            <ControlPanel />
            {/* <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Kartu />
            </div> */}
        </div>
    );
}
