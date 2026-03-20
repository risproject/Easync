"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IoMdPower } from "react-icons/io";
import { FiRefreshCw } from "react-icons/fi";
import { useAutomationApi, useRelayControlApi, useRelayLogsApi } from "../hook/useApiDevice";

const RELAY_TIMEOUT_MS = 15000;
const RELAY_POLL_MS = 1000;

const formatSyncTs = (ts) => {
    if (!ts) return "-";
    const dateObj = new Date(ts);
    if (isNaN(dateObj.getTime())) return ts;

    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const mins = String(dateObj.getMinutes()).padStart(2, "0");
    const secs = String(dateObj.getSeconds()).padStart(2, "0");

    return `${day}-${month}-${year}  -  ${hours}:${mins}:${secs}`;
};

const PowerToggle = ({ label, value, onClick, loading, disabled }) => {
    const isActuallyDisabled = loading || disabled;
    const colorClass = value ? "bg-emerald-500 shadow-emerald-200" : "bg-red-500 shadow-red-200";
    return (
        <button type="button" onClick={onClick} disabled={isActuallyDisabled} className={`flex flex-col items-center gap-2 ${isActuallyDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
            <span className={`relative inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md transition-all duration-300 ${colorClass}`}>
                {loading ? (
                    <span className="h-8 w-8 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                ) : value ? (
                    <span className="text-sm font-black">ON</span>
                ) : (
                    <IoMdPower className="h-6 w-6" />
                )}
            </span>
            <span className="text-xs font-semibold text-slate-700">{label}</span>
        </button>
    );
};

const RelayButton = ({ label, active, onClick, disabled, loading }) => {
    const indicator = loading ? "bg-slate-400" : active ? "bg-emerald-500" : "bg-red-500";
    const isDisabled = disabled || loading;
    const disabledClass = loading ? "opacity-70 cursor-wait" : disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
    return (
        <button type="button" onClick={onClick} disabled={isDisabled} className={`flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ${disabledClass}`}>
            <span>{label}</span>
            {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin" />
            ) : (
                <span className={`h-5 w-2 rounded ${indicator}`} />
            )}
        </button>
    );
};

const isTrue = (val) => val === true || val === "true" || val === 1 || val === "1";

export default function ControlPanel() {
    const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID || "device-001";
    const { automation, updateAutomation, refresh: refreshAutomation } = useAutomationApi(deviceId, { pollMs: 0 });
    const { relay: liveRelay, setRelay, refresh: refreshRelay } = useRelayControlApi(deviceId, { pollMs: 0 });
    const { logs, refresh: refreshRelayLogs } = useRelayLogsApi(deviceId, { limit: 1 });
    const [busyKey, setBusyKey] = useState(null);

    // Relay loading state: { [relayKey]: true }
    const [relayLoading, setRelayLoading] = useState({});
    const relayTimersRef = useRef({});
    const anyRelayLoading = Object.values(relayLoading).some(Boolean);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            Object.values(relayTimersRef.current).forEach(({ poll, timeout }) => {
                if (poll) clearInterval(poll);
                if (timeout) clearTimeout(timeout);
            });
        };
    }, []);

    useEffect(() => {
        refreshAutomation();
        refreshRelay();
        refreshRelayLogs();
    }, [refreshAutomation, refreshRelay, refreshRelayLogs]);

    const lastRelayLog = logs?.[0] || null;
    const relayState = lastRelayLog || liveRelay || {};

    const liveEnabled = automation?.live_enable === true;
    const relayEnabled = automation?.relay_enable === true;
    const modeValue = automation?.mode || "manual";

    const handleToggle = async (fieldKey, nextValue) => {
        if (busyKey) return;
        setBusyKey(fieldKey);
        try {
            await updateAutomation({ [fieldKey]: nextValue });
            refreshAutomation();
        } catch (err) {
            console.error(err);
        } finally {
            setBusyKey(null);
        }
    };

    const handleModeChange = async (event) => {
        const next = event.target.value;
        if (busyKey) return;
        setBusyKey("mode");
        try {
            await updateAutomation({ mode: next });
            refreshAutomation();
        } catch (err) {
            console.error(err);
        } finally {
            setBusyKey(null);
        }
    };

    const relayButtons = useMemo(() => ([
        { key: "relay1", label: "Relay 1" },
        { key: "relay2", label: "Relay 2" },
        { key: "relay3", label: "Relay 3" },
        { key: "relay4", label: "Relay 4" }
    ]), []);

    const clearRelayTimers = useCallback((key) => {
        const timers = relayTimersRef.current[key];
        if (timers) {
            if (timers.poll) clearInterval(timers.poll);
            if (timers.timeout) clearTimeout(timers.timeout);
            delete relayTimersRef.current[key];
        }
    }, []);

    const stopRelayLoading = useCallback((key) => {
        clearRelayTimers(key);
        setRelayLoading((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }, [clearRelayTimers]);

    const handleRelayToggle = async (key) => {
        if (!key) return;
        if (!relayEnabled) return;
        if (modeValue !== "manual" && key === "relay1") return;
        if (anyRelayLoading || busyKey) return;

        // Get baseline: timestamp of current latest relay log BEFORE we POST
        const baselineTs = lastRelayLog?.ts || null;

        // Start loading
        setRelayLoading((prev) => ({ ...prev, [key]: true }));

        try {
            // POST the relay command to Supabase
            const current = relayState?.[key] ?? false;
            await setRelay({ [key]: !current });

            // Start polling relay_logs for a newer entry
            const pollTimer = setInterval(async () => {
                try {
                    await refreshRelayLogs();
                } catch (err) {
                    console.error("Poll relay_logs error:", err);
                }
            }, RELAY_POLL_MS);

            // Set timeout for bounce-back
            const timeoutTimer = setTimeout(() => {
                // Timeout: bounce back to false
                console.warn(`Relay ${key} timeout — bouncing back to false`);
                setRelay({ [key]: false }).catch(console.error);
                refreshRelay();
                refreshRelayLogs();
                stopRelayLoading(key);
            }, RELAY_TIMEOUT_MS);

            relayTimersRef.current[key] = {
                poll: pollTimer,
                timeout: timeoutTimer,
                baselineTs,
            };
        } catch (err) {
            console.error("Relay toggle error:", err);
            stopRelayLoading(key);
        }
    };

    // Watch logs changes — check if a new relay_log arrived after baseline
    useEffect(() => {
        const loadingKeys = Object.keys(relayLoading).filter((k) => relayLoading[k]);
        if (loadingKeys.length === 0) return;

        const latestLog = logs?.[0] || null;
        if (!latestLog?.ts) return;

        for (const key of loadingKeys) {
            const timers = relayTimersRef.current[key];
            if (!timers) continue;

            const baselineTs = timers.baselineTs;

            // Compare: if latest log timestamp is newer than baseline, ESP32 has confirmed
            const logTime = new Date(latestLog.ts).getTime();
            const baseTime = baselineTs ? new Date(baselineTs).getTime() : 0;

            if (logTime > baseTime) {
                // ESP32 confirmed — update state from logs and stop loading
                refreshRelay();
                stopRelayLoading(key);
            }
        }
    }, [logs, relayLoading, refreshRelay, stopRelayLoading]);

    const handleRefresh = () => {
        if (anyRelayLoading) return;
        refreshAutomation();
        refreshRelay();
        refreshRelayLogs();
    };

    return (
        <div className="bg-white shadow-lg rounded-3xl p-6 border border-black/10">
            <div className="flex items-center justify-center relative mb-4">
                <div className="text-lg font-semibold text-slate-900">Control Panel</div>
                <button type="button" onClick={handleRefresh} disabled={anyRelayLoading} className={` cursor-pointer absolute right-0 ${anyRelayLoading ? "text-slate-300 cursor-not-allowed" : "text-slate-500 hover:text-slate-700"}`} aria-label="Refresh">
                    <FiRefreshCw className="h-4" />
                </button>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-6 py-5 justify-center md:justify-start">
                        <PowerToggle label="Live Data" value={liveEnabled} loading={busyKey === "live_enable"} disabled={anyRelayLoading || (!!busyKey && busyKey !== "live_enable")} onClick={() => handleToggle("live_enable", !liveEnabled)} />
                        <PowerToggle label="Relay Ctrl" value={relayEnabled} loading={busyKey === "relay_enable"} disabled={anyRelayLoading || (!!busyKey && busyKey !== "relay_enable")} onClick={() => handleToggle("relay_enable", !relayEnabled)} />
                    </div>

                    <div className="md:ml-6 w-full md:w-56">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Mode</label>
                        <div className="relative">
                            <select
                                value={modeValue}
                                onChange={handleModeChange}
                                disabled={!!busyKey || anyRelayLoading}
                                className={`w-full appearance-none rounded-full px-4 py-2 text-sm font-medium shadow-inner transition-colors duration-300 ${(busyKey || anyRelayLoading) ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50" : "bg-slate-100 text-slate-700"}`}
                            >
                                <option value="manual">Manual</option>
                                <option value="auto">Automatic</option>
                                <option value="smart">Smart Auto</option>
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                <span>▾</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-2 grid-cols-2 pb-4">
                    {relayButtons.map((item) => {
                        const isAutoDisabled = modeValue !== "manual" && item.key === "relay1";
                        return (
                            <RelayButton
                                key={item.key}
                                label={item.label}
                                active={isTrue(relayState?.[item.key])}
                                disabled={!relayEnabled || isAutoDisabled || (anyRelayLoading && !relayLoading[item.key]) || Boolean(busyKey)}
                                loading={Boolean(relayLoading[item.key])}
                                onClick={() => handleRelayToggle(item.key)}
                            />
                        );
                    })}
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                    <div>Last Relay Sync : {formatSyncTs(lastRelayLog?.ts)}</div>
                    <div>Setting Sync : {formatSyncTs(automation?.applied_at)}</div>
                </div>
            </div>
        </div>
    );
}
