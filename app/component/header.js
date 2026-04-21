"use client";

import { useEffect, useState } from "react";
import { useSensorLogsApi, useAutomationApi } from "../hook/useApiDevice";

export default function Header({ onPowerToggle }) {
    const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID || "device-001";

    // hooks for status
    const { automation } = useAutomationApi(deviceId, { pollMs: 60000 }); // moderate polling
    // limit 1 is enough for checking latest timestamp for online status
    const { logs: sensorLogs } = useSensorLogsApi(deviceId, { limit: 1 });

    const [isOnline, setIsOnline] = useState(false);
    const liveEnabled = automation?.live_enable === true;

    // Cek Status Online
    useEffect(() => {
        const latestLogTs = sensorLogs?.[0]?.sensor_ts;
        if (latestLogTs) {
            const diffMin = (new Date().getTime() - new Date(latestLogTs).getTime()) / (1000 * 60);
            setIsOnline(diffMin < 6 && diffMin >= -1);
        } else {
            setIsOnline(false);
        }
    }, [sensorLogs]);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-slate-200">
            <div className="w-full px-6 py-3 flex items-center justify-between">
                <div className="ml-auto flex items-center">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${isOnline ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {isOnline ? "Online" : "Offline"}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${liveEnabled ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-700"}`}>
                            {liveEnabled ? "Live" : "Sleep"}
                        </span>
                    </div>
                </div>
            </div>
        </nav>
    );
}
