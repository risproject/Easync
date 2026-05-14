"use client";

import { useEffect, useRef, useState } from "react";
import { IoMdPower } from "react-icons/io";
import { FiRefreshCw, FiAlertTriangle } from "react-icons/fi";
import { PiSparkleFill } from "react-icons/pi";
import { GiPlantWatering } from "react-icons/gi";
import { FaXmark } from "react-icons/fa6";
import { useAutomationApi, useRelayControlApi, useRelayLogsApi } from "../hook/useApiDevice";
import { formatTimestamp } from "../utils/sensorUtils";

const RELAY_TIMEOUT_MS = 15000;
const RELAY_POLL_MS = 1000;
const RELAY_KEYS = ["relay1", "relay2", "relay3", "relay4"];

function isTrue(val) {
    return val === true || val === "true" || val === 1 || val === "1";
}

export default function ControlPanel() {
    const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID || "device-001";

    const { automation, updateAutomation, refresh: refreshAutomation } = useAutomationApi(deviceId, { pollMs: 0 });
    const { relay: liveRelay, setRelay, refresh: refreshRelay } = useRelayControlApi(deviceId, { pollMs: 0 });
    const { logs, refresh: refreshRelayLogs } = useRelayLogsApi(deviceId, { limit: 1 });

    const [busyKey, setBusyKey] = useState(null);
    const [relayLoading, setRelayLoading] = useState({});
    const [pendingMode, setPendingMode] = useState(null);
    const timersRef = useRef({});

    // Ambil data pertama kali
    useEffect(() => {
        refreshAutomation();
        refreshRelay();
        refreshRelayLogs();
    }, [refreshAutomation, refreshRelay, refreshRelayLogs]);

    // Bersihkan semua timer saat unmount
    useEffect(() => {
        return () => {
            Object.values(timersRef.current).forEach(({ poll, timeout }) => {
                clearInterval(poll);
                clearTimeout(timeout);
            });
        };
    }, []);

    const lastLog = logs?.[0] ?? null;
    const relayState = lastLog ?? liveRelay ?? {};
    const liveEnabled = automation?.live_enable === true;
    const relayEnabled = automation?.relay_enable === true;
    const mode = automation?.mode ?? "manual";
    const anyRelayLoading = Object.values(relayLoading).some(Boolean);

    function stopRelayLoading(key) {
        const t = timersRef.current[key];
        if (t) {
            clearInterval(t.poll);
            clearTimeout(t.timeout);
            delete timersRef.current[key];
        }
        setRelayLoading((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }

    async function handleSettingToggle(field, nextValue) {
        if (busyKey) return;
        setBusyKey(field);
        try {
            await updateAutomation({ [field]: nextValue });
            refreshAutomation();
        } finally {
            setBusyKey(null);
        }
    }

    function handleModeChange(e) {
        if (busyKey || anyRelayLoading) return;
        setPendingMode(e.target.value);
    }

    async function confirmModeChange() {
        if (!pendingMode || busyKey) return;
        setBusyKey("mode");
        try {
            await updateAutomation({ mode: pendingMode });
            refreshAutomation();
        } finally {
            setBusyKey(null);
            setPendingMode(null);
        }
    }

    async function handleRelayToggle(key) {
        if (!relayEnabled || anyRelayLoading || busyKey) return;
        if (mode !== "manual" && key === "relay1") return;

        const baselineTs = lastLog?.ts ?? null;
        setRelayLoading((prev) => ({ ...prev, [key]: true }));

        try {
            const current = relayState?.[key] ?? false;
            await setRelay({ [key]: !current });

            const poll = setInterval(() => refreshRelayLogs().catch(console.error), RELAY_POLL_MS);
            const timeout = setTimeout(() => {
                console.warn(`Relay ${key} timeout — membatalkan`);
                setRelay({ [key]: false }).catch(console.error);
                refreshRelay();
                refreshRelayLogs();
                stopRelayLoading(key);
            }, RELAY_TIMEOUT_MS);

            timersRef.current[key] = { poll, timeout, baselineTs };
        } catch (err) {
            console.error("Relay error:", err);
            stopRelayLoading(key);
        }
    }

    useEffect(() => {
        const activeKeys = Object.keys(relayLoading).filter((k) => relayLoading[k]);
        if (activeKeys.length === 0 || !lastLog?.ts) return;

        for (const key of activeKeys) {
            const timers = timersRef.current[key];
            if (!timers) continue;
            const logTime = new Date(lastLog.ts).getTime();
            const baseTime = timers.baselineTs ? new Date(timers.baselineTs).getTime() : 0;
            if (logTime > baseTime) {
                refreshRelay();
                stopRelayLoading(key);
            }
        }
    }, [logs, relayLoading, refreshRelay]);

    function handleRefresh() {
        if (anyRelayLoading) return;
        refreshAutomation();
        refreshRelay();
        refreshRelayLogs();
    }

    // Variabel turunan untuk tombol master (agar JSX tidak berantakan)
    const liveLoading = busyKey === "live_enable";
    const liveDisabled = anyRelayLoading || (!!busyKey && busyKey !== "live_enable");
    const relayCtrlLoading = busyKey === "relay_enable";
    const relayCtrlDisabled = anyRelayLoading || (!!busyKey && busyKey !== "relay_enable");

    const modePopupData = {
        manual: {
            title: "Perhatian !",
            text1: "Mode operasional akan diubah ke Manual.",
            text2: "Kontrol penyiraman secara penuh pada pengguna.",
            icon: <GiPlantWatering size={40} />,
            iconBg: "bg-[#d4f7eb]",
            iconColor: "text-teal-600",
            btnBg: "bg-teal-600 hover:bg-teal-700",
        },
        auto: {
            title: "Perhatian !",
            text1: "Mode operasional akan diubah ke Otomatis.",
            text2: "Kontrol penyiraman secara penuh berdasarkan target kelembapan tanah.",
            icon: <PiSparkleFill size={40} />,
            iconBg: "bg-[#d4f7eb]",
            iconColor: "text-teal-600",
            btnBg: "bg-teal-600 hover:bg-teal-700",
        },
        smart: {
            title: "Berbahaya !",
            text1: "Mode operasional akan diubah ke Smart ANFIS.",
            text2: "Mode ini bersifat eksperimental, dapat tidak bekerja sebagaimana mestinya.",
            icon: <FiAlertTriangle size={40} />,
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            btnBg: "bg-red-600 hover:bg-red-700",
        }
    };

    return (
        <div className="bg-white shadow-lg rounded-xl p-4 border border-black/10">

            {/* Header */}
            <div className="flex items-center justify-center relative mb-4">
                <div className="text-lg font-semibold text-slate-900">Panel Kontrol</div>
                <button type="button" onClick={handleRefresh} disabled={anyRelayLoading} className={`absolute right-0 cursor-pointer ${anyRelayLoading ? "text-slate-300 cursor-not-allowed" : "text-slate-500 hover:text-slate-700"}`} aria-label="Refresh">
                    <FiRefreshCw className="h-4" />
                </button>
            </div>

            <div className="space-y-4">

                {/* Power Toggle & Mode */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-6 py-5 justify-center md:justify-start">

                        {/* Tombol Live Data */}
                        <button type="button" onClick={() => handleSettingToggle("live_enable", !liveEnabled)} disabled={liveLoading || liveDisabled} className={`flex flex-col items-center gap-2 ${(liveLoading || liveDisabled) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                            <span className={`relative inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md transition-all duration-300 ${liveEnabled ? "bg-emerald-500 shadow-emerald-200" : "bg-red-500 shadow-red-200"}`}>
                                {liveLoading ? (
                                    <span className="h-8 w-8 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                                ) : liveEnabled ? (
                                    <span className="text-sm font-black">ON</span>
                                ) : (
                                    <IoMdPower className="h-6 w-6" />
                                )}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">Data Terkini</span>
                        </button>

                        {/* Tombol Relay Ctrl */}
                        <button type="button" onClick={() => handleSettingToggle("relay_enable", !relayEnabled)} disabled={relayCtrlLoading || relayCtrlDisabled} className={`flex flex-col items-center gap-2 ${(relayCtrlLoading || relayCtrlDisabled) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`} >
                            <span className={`relative inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md transition-all duration-300 ${relayEnabled ? "bg-emerald-500 shadow-emerald-200" : "bg-red-500 shadow-red-200"}`}>
                                {relayCtrlLoading ? (
                                    <span className="h-8 w-8 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                                ) : relayEnabled ? (
                                    <span className="text-sm font-black">ON</span>
                                ) : (
                                    <IoMdPower className="h-6 w-6" />
                                )}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">Master Saklar</span>
                        </button>

                    </div>

                    {/* Pilihan Mode */}
                    <div className="md:ml-6 w-full md:w-56">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Mode Operasional</label>
                        <div className="relative">
                            <select value={pendingMode || mode} onChange={handleModeChange} disabled={!!busyKey || anyRelayLoading} className={`w-full appearance-none rounded-xl px-4 py-2 text-sm font-medium shadow-inner transition-colors duration-300 ${(busyKey || anyRelayLoading) ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50" : "bg-slate-100 text-slate-700 cursor-pointer"}`} >
                                <option value="manual">Manual</option>
                                <option value="auto">Automatic</option>
                                <option value="smart">Smart ANFIS</option>
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">▾</span>
                        </div>
                    </div>
                </div>

                {/* Tombol Relay 1-4 */}
                {(() => {
                    function RelayButton({ relayKey, label, className = "" }) {
                        const active = isTrue(relayState?.[relayKey]);
                        const isLoading = Boolean(relayLoading[relayKey]);
                        const isAutoControlled = mode !== "manual" && relayKey === "relay1";
                        const isDisabled = !relayEnabled || isAutoControlled || (anyRelayLoading && !relayLoading[relayKey]) || Boolean(busyKey);
                        const cursorClass = isLoading ? "cursor-wait" : isDisabled ? "cursor-not-allowed" : "cursor-pointer";
                        return (
                            <div className={`flex items-center justify-between ${className}`}>
                                <span className="text-sm text-slate-600 font-medium">{label}</span>
                                <button type="button"
                                    onClick={() => handleRelayToggle(relayKey)}
                                    disabled={isDisabled || isLoading}
                                    className={`relative inline-flex h-9 w-20 shrink-0 items-center rounded-xl bg-slate-200 p-1 transition-colors focus:outline-none ${cursorClass} ${isDisabled ? "opacity-50" : ""}`}>
                                    {isLoading ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="h-5 w-5 rounded-full border-[3px] border-slate-300 border-t-blue-500 animate-spin" />
                                        </div>
                                    ) : (
                                        <span
                                            className={`inline-flex h-6 w-8 items-center justify-center rounded-lg text-[12px] font-black text-white shadow-sm transition-transform duration-300 ${active ? "translate-x-10 bg-emerald-500" : "translate-x-0 bg-red-500"
                                                }`}>
                                            {active ? "ON" : "OFF"}
                                        </span>
                                    )}
                                </button>
                            </div>
                        );
                    }
                    return (
                        <div className="grid gap-3 grid-cols-1 pb-4 pt-4 max-w-xs">
                            <RelayButton relayKey="relay1" label="Pompa Irigasi Tetes" />
                            <RelayButton relayKey="relay2" label="Saklar 1" />
                            <RelayButton relayKey="relay3" label="Saklar 2" />
                        </div>
                    );
                })()}

                {/* Info sinkronisasi terakhir */}
                <div className="text-xs text-slate-500 space-y-1">
                    <div>Last Relay Sync : {formatTimestamp(lastLog?.ts)}</div>
                    <div>Setting Sync : {formatTimestamp(automation?.applied_at)}</div>
                </div>

            </div>

            {/* Modal Konfirmasi Mode */}
            {pendingMode && modePopupData[pendingMode] && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPendingMode(null)} />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[320px] p-6 relative flex flex-col items-center text-center animate-in fade-in zoom-in duration-300 z-10">
                        <button type="button" onClick={() => setPendingMode(null)} className="absolute top-4 right-4 text-white bg-red-500 hover:bg-red-600 cursor-pointer p-1.5 rounded-lg transition-colors shadow-sm">
                            <FaXmark size={16} />
                        </button>

                        <div className={`w-20 h-20 mt-2 ${modePopupData[pendingMode].iconBg} ${modePopupData[pendingMode].iconColor} rounded-full flex items-center justify-center mb-6`}>
                            {modePopupData[pendingMode].icon}
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-4">{modePopupData[pendingMode].title}</h3>
                        <p className="text-sm text-slate-800 mb-4 px-2">{modePopupData[pendingMode].text1}</p>
                        <p className="text-sm text-slate-600 mb-8 px-2 leading-relaxed">{modePopupData[pendingMode].text2}</p>

                        <button
                            type="button"
                            onClick={confirmModeChange}
                            className={`w-full py-1.5 ${modePopupData[pendingMode].btnBg} text-white font-medium rounded-lg transition-all cursor-pointer shadow-lg active:scale-95`}>
                            Lanjutkan
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
