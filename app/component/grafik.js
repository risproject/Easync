"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer
} from "recharts";
import { useAutomationApi, useLiveSensorApi } from "../hook/useApiDevice";

const KARTU_CONFIG = {
    cahaya: { min: 1500, max: 4000, satuan: "Lx" },
    suhuUdara: { min: 18, max: 35, satuan: "°C" },
    kelembabanUdara: { min: 60, max: 80, satuan: "%" },
    kelembabanTanah: { min: 60, max: 80, satuan: "%" },
    suhuTanah: { min: 18, max: 35, satuan: "°C" }
};

// Menghitung level berdasarkan batas
const getLevel = (value, min, max) => {
    if (value < min) return 1;
    if (value > max) return 3;
    return 2;
};

// Label status
const getStatusLabel = (level) => ({
    1: "Rendah",
    2: "Normal",
    3: "Tinggi"
}[level] || "");

// Warna status
const getStatusColor = (level) => ({
    1: "#FD9A00", // Waspada
    2: "#00BBA8", // Optimal
    3: "#FB2C36"  // Bahaya
}[level] || "#999");

const num = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);
const avg = (a, b) => {
    const aOk = Number.isFinite(a);
    const bOk = Number.isFinite(b);
    if (aOk && bOk) return (a + b) / 2;
    if (aOk) return a;
    if (bOk) return b;
    return 0;
};

const buildDataPoint = (sensor) => {
    if (!sensor) return [];

    const items = [
        {
            id: 5,
            parameter: "Cahaya",
            subjudul: "Digital",
            nilai: num(sensor.lux),
            satuan: KARTU_CONFIG.cahaya.satuan,
            min: KARTU_CONFIG.cahaya.min,
            max: KARTU_CONFIG.cahaya.max
        },
        {
            id: 4,
            parameter: "Suhu Udara",
            subjudul: "DHT22",
            nilai: num(sensor.air_temp),
            satuan: KARTU_CONFIG.suhuUdara.satuan,
            min: KARTU_CONFIG.suhuUdara.min,
            max: KARTU_CONFIG.suhuUdara.max
        },
        {
            id: 2,
            parameter: "Kelembaban Udara",
            subjudul: "DHT22",
            nilai: num(sensor.air_hum),
            satuan: KARTU_CONFIG.kelembabanUdara.satuan,
            min: KARTU_CONFIG.kelembabanUdara.min,
            max: KARTU_CONFIG.kelembabanUdara.max
        },
        {
            id: 1,
            parameter: "Kelembaban Tanah",
            subjudul: "Soil Capacitive",
            nilai: avg(sensor.soil_moisture1, sensor.soil_moisture2),
            satuan: KARTU_CONFIG.kelembabanTanah.satuan,
            min: KARTU_CONFIG.kelembabanTanah.min,
            max: KARTU_CONFIG.kelembabanTanah.max
        },
        {
            id: 3,
            parameter: "Suhu Tanah",
            subjudul: "DS18B",
            nilai: avg(sensor.temp1, sensor.temp2),
            satuan: KARTU_CONFIG.suhuTanah.satuan,
            min: KARTU_CONFIG.suhuTanah.min,
            max: KARTU_CONFIG.suhuTanah.max
        }
    ];

    return items.map((item) => ({
        ...item,
        level: getLevel(item.nilai, item.min, item.max)
    }));
};

const formatSyncTs = (ts) => {
    if (!ts) return "-";
    const parts = String(ts).split("T");
    if (parts.length < 2) return ts;
    const date = parts[0];
    const time = parts[1].split("+")[0].split("Z")[0];
    if (!date || !time) return ts;
    const dateParts = date.split("-");
    if (dateParts.length === 3) {
        const [year, month, day] = dateParts;
        return `${day}-${month}-${year} at ${time}`;
    }
    return `${date}  -  ${time}`;
};

export default function Grafik() {
    const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID || "device-001";
    const { automation } = useAutomationApi(deviceId, { pollMs: 0 });
    const liveEnabled = automation?.live_enable === true;
    const { sensor } = useLiveSensorApi(deviceId, { pollMs: 2000, liveEnabled });
    const [lastSensor, setLastSensor] = useState(null);
    useEffect(() => {
        if (sensor) setLastSensor(sensor);
    }, [sensor]);
    const dataPoint = useMemo(() => buildDataPoint(lastSensor), [lastSensor]);
    const hasSensor = Boolean(lastSensor);
    const radarVisible = liveEnabled && hasSensor;
    const [width, setWidth] = useState(768);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const renderTick = ({ x, y, index, cx, cy }) => {
        const d = dataPoint?.[index];
        if (!d) return null;

        const fontSize = width < 640 ? 10 : 12;
        const r = width < 640 ? 16 : 24;
        const maxChars = 8;
        const lineGap = 2;

        const wrapText = (text = "") => {
            const words = text.split(" ");
            const lines = [];
            let line = "";

            words.forEach(w => {
                if ((line + " " + w).trim().length <= maxChars) line = (line + " " + w).trim();
                else {
                    if (line) lines.push(line);
                    line = w;
                }
            });

            if (line) lines.push(line);
            return lines;
        };

        const lines = wrapText(d.parameter);
        const angle = Math.atan2(y - cy, x - cx);
        const dx = Math.cos(angle) * r;
        const dy = Math.sin(angle) * r;

        const valueText = radarVisible ? `${d.nilai}${d.satuan}` : "-";

        return (
            <text x={x + dx} y={y + dy} textAnchor="middle" style={{ fontSize }} className="fill-gray-800 font-semibold" pointerEvents="none">
                {lines.map((line, i) => (
                    <tspan key={i} x={x + dx} dy={i === 0 ? 0 : fontSize + lineGap}>
                        {line}
                    </tspan>
                ))}
                <tspan x={x + dx} dy={fontSize + lineGap}>
                    {valueText}
                </tspan>
            </text>
        );
    };

    const renderDot = ({ cx, cy, index }) => {
        if (!radarVisible) return null;
        const d = dataPoint?.[index];
        if (!d) return null;
        return (
            <circle cx={cx} cy={cy} r={5} fill={getStatusColor(d.level)} stroke="#fff" strokeWidth={1} />
        );
    };

    return (
        <div className="bg-white shadow-md rounded-2xl p-4 text-center border border-black/10">
            <h2 className="text-md font-semibold mb-2">Live Data</h2>
            <div className="text-xs text-slate-500 mb-3">
                Last sync: {liveEnabled && sensor?.sensor_ts ? formatSyncTs(sensor.sensor_ts) : "-"}
            </div>
            <div className="flex justify-center gap-4 mb-2 text-xs md:text-sm">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: "#FD9A00" }} />
                    Waspada
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: "#00BBA8" }} />
                    Optimal
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: "#FB2C36" }} />
                    Bahaya
                </div>
            </div>
            <div className="w-full h-64 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={dataPoint} outerRadius={width < 768 ? "60%" : "70%"}>
                        <PolarGrid radialLines={false} stroke="rgba(0,177,160,0.8)" />
                        <PolarRadiusAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} tick={false} axisLine={false} />
                        <PolarAngleAxis dataKey="parameter" tick={renderTick} />
                        <Radar
                            dataKey="level"
                            stroke="#00C1AD"
                            strokeOpacity={radarVisible ? 1 : 0}
                            strokeWidth={2}
                            fill="#00BBA8"
                            fillOpacity={radarVisible ? 0.6 : 0}
                            dot={radarVisible ? renderDot : false}
                            isAnimationActive={false}
                            animationDuration={0}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
}
