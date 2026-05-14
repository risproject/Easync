"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Grafik from "../component/grafik";
import ControlPanel from "../component/controlPanel";
import LoadingScreen from "../component/LoadingScreen";
import { useLiveSensorApi, useAutomationApi } from "../hook/useApiDevice";
import { FiAlertTriangle } from "react-icons/fi";
import { FaXmark } from "react-icons/fa6";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID || "device-001";

    const { sensor } = useLiveSensorApi(deviceId, { pollMs: 0 });
    const { automation } = useAutomationApi(deviceId, { pollMs: 0 });
    const [showWarning, setShowWarning] = useState(false);
    const [warningData, setWarningData] = useState(null);
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.replace("/login");
    }, [user, loading, router]);

    useEffect(() => {
        if (!hasChecked && sensor && automation) {
            const isFusion = automation.soil_fusion === true || automation.soil_fusion === "true";
            const moisture = isFusion
                ? (Number(sensor.soil_moisture1) + Number(sensor.soil_moisture2)) / 2
                : Number(sensor.soil_moisture1);

            const min = Number(automation.soil_min);
            const max = Number(automation.soil_max);

            if (moisture < min) {
                setWarningData({
                    value: Math.round(moisture),
                    status: "Rendah",
                    colorClass: "bg-orange-100 text-orange-600",
                    btnClass: "bg-orange-500 hover:bg-orange-600",
                    iconColor: "text-orange-600"
                });
                setShowWarning(true);
            } else if (moisture > max) {
                setWarningData({
                    value: Math.round(moisture),
                    status: "Tinggi",
                    colorClass: "bg-red-100 text-red-600",
                    btnClass: "bg-red-500 hover:bg-red-600",
                    iconColor: "text-red-600"
                });
                setShowWarning(true);
            }
            setHasChecked(true);
        }
    }, [sensor, automation, hasChecked]);

    useEffect(() => {
        if (showWarning) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showWarning]);

    if (loading) return <LoadingScreen />;
    if (!user) return null;

    return (
        <div className="p-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Grafik />
            <ControlPanel />

            {/* Modal Peringatan Kelembapan */}
            {showWarning && warningData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[320px] p-8 relative flex flex-col items-center text-center animate-in fade-in zoom-in duration-300 z-10">
                        <button type="button" onClick={() => setShowWarning(false)} className="absolute top-4 right-4 text-white bg-red-500 hover:bg-red-600 cursor-pointer p-1.5 rounded-lg transition-colors shadow-sm">
                            <FaXmark size={16} />
                        </button>

                        <div className={`w-24 h-24 ${warningData.colorClass.split(' ')[0]} ${warningData.iconColor} rounded-full flex items-center justify-center mb-6`}>
                            <FiAlertTriangle size={48} />
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-4">Perhatian !</h3>

                        <div className="text-3xl font-bold text-slate-900 mb-2">{warningData.value}%</div>
                        <div className="text-sm text-slate-800 mb-6">Kelembapan Tanah <strong className="font-bold">{warningData.status}</strong></div>

                        <p className="text-sm text-slate-600 mb-8 px-2 leading-relaxed">
                            Berisiko pada metabolisme dan fisiologi tanaman.
                        </p>

                        <button
                            type="button"
                            onClick={() => setShowWarning(false)}
                            className={`w-full py-1.5 gap-2 px-4 ${warningData.btnClass} text-white font-medium rounded-lg transition-all cursor-pointer shadow-lg active:scale-95`}>
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
