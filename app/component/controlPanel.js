"use client";

import { useEffect, useRef, useState } from "react";
import { IoMdPower } from "react-icons/io";
import { FiRefreshCw } from "react-icons/fi";
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

    async function handleModeChange(e) {
        if (busyKey) return;
        setBusyKey("mode");
        try {
            await updateAutomation({ mode: e.target.value });
            refreshAutomation();
        } finally {
            setBusyKey(null);
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

    return (
        <div className="bg-white shadow-lg rounded-xl p-4 border border-black/10">

            {/* Header */}
            <div className="flex items-center justify-center relative mb-4">
                <div className="text-lg font-semibold text-slate-900">Control Panel</div>
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
                            <span className="text-xs font-semibold text-slate-700">Live Data</span>
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
                            <span className="text-xs font-semibold text-slate-700">Relay Ctrl</span>
                        </button>

                    </div>

                    {/* Pilihan Mode */}
                    <div className="md:ml-6 w-full md:w-56">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Mode</label>
                        <div className="relative">
                            <select value={mode} onChange={handleModeChange} disabled={!!busyKey || anyRelayLoading} className={`w-full appearance-none rounded-md px-4 py-2 text-sm font-medium shadow-inner transition-colors duration-300 ${(busyKey || anyRelayLoading) ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50" : "bg-slate-100 text-slate-700"}`} >
                                <option value="manual">Manual</option>
                                <option value="auto">Automatic</option>
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">▾</span>
                        </div>
                    </div>
                </div>

                {/* Tombol Relay 1-4 */}
                <div className="grid gap-2 grid-cols-2 pb-4">
                    {RELAY_KEYS.map((key, i) => {
                        const active = isTrue(relayState?.[key]);
                        const isLoading = Boolean(relayLoading[key]);
                        const isAutoControlled = mode !== "manual" && key === "relay1";
                        const isDisabled = !relayEnabled || isAutoControlled || (anyRelayLoading && !relayLoading[key]) || Boolean(busyKey);
                        const cursorClass = isLoading ? "opacity-70 cursor-wait" : isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
                        const statusColor = isLoading ? "bg-slate-400" : active ? "bg-emerald-500" : "bg-red-500";

                        return (
                            <button key={key} type="button" onClick={() => handleRelayToggle(key)} disabled={isDisabled || isLoading} className={`flex items-center justify-between rounded-md bg-slate-200 pl-3 pr-2 py-2 text-sm font-medium text-slate-700 shadow-sm ${cursorClass}`} >
                                <span>Relay {i + 1}</span>
                                {isLoading ? (
                                    <span className="h-4 w-4 mr-2 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin" />
                                ) : (
                                    <span className={`px-2 py-1 rounded text-[10px] font-black text-white ${statusColor}`}>
                                        {active ? "ON" : "OFF"}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Info sinkronisasi terakhir */}
                <div className="text-xs text-slate-500 space-y-1">
                    <div>Last Relay Sync : {formatTimestamp(lastLog?.ts)}</div>
                    <div>Setting Sync : {formatTimestamp(automation?.applied_at)}</div>
                </div>

            </div>
        </div>
    );
}
