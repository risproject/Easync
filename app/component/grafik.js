"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from "recharts";
import { useAutomationApi, useLiveSensorApi } from "../hook/useApiDevice";
import {
    useSensorConfig, getLevel, getStatusColor, formatTimestamp
} from "../utils/sensorUtils";


function buildRadarData(sensor, parameters) {
    if (!sensor || !parameters) return [];
    return parameters.map((p) => {
        const nilai = p.getValue(sensor);
        return {
            ...p,
            nilai,
            level: getLevel(nilai, p.min, p.max),
        };
    });
}

function useWindowWidth(initialWidth = 768) {
    const [width, setWidth] = useState(initialWidth);
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    return width;
}

const legenda = [
    { label: "Waspada", color: "#FD9A00" },
    { label: "Optimal", color: "#00BBA8" },
    { label: "Bahaya", color: "#FB2C36" },
];
function StatusLegend() {
    return (
        <div className="flex justify-center gap-4 mb-2 text-xs md:text-sm">
            {legenda.map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: color }}
                    />
                    {label}
                </div>
            ))}
        </div>
    );
}

const wrapText = (text, max = 8) => {
    const lines = [];
    let current = "";
    text.split(" ").forEach(word => {
        if ((current + " " + word).trim().length <= max) {
            current = (current + " " + word).trim();
        } else {
            lines.push(current);
            current = word;
        }
    });
    lines.push(current);
    return lines;
};

function RadarTickLabel({ x, y, index, cx, cy, dataPoint, radarVisible, windowWidth }) {
    const item = dataPoint?.[index];
    if (!item) return null;

    const isMobile = windowWidth < 640;
    const size = isMobile ? 10 : 12;
    const offset = isMobile ? 16 : 24;
    const angle = Math.atan2(y - cy, x - cx);
    const dx = Math.cos(angle) * offset;
    const dy = Math.sin(angle) * offset;
    const lines = wrapText(item.parameter);
    const value = radarVisible ? `${item.nilai}${item.satuan}` : "-";

    return (
        <text x={x + dx} y={y + dy} textAnchor="middle" style={{ fontSize: size }} className="fill-gray-800 font-semibold" pointerEvents="none">
            {lines.map((line, i) => (
                <tspan key={i} x={x + dx} dy={i === 0 ? 0 : size + 2}>{line}</tspan>
            ))}
            <tspan x={x + dx} dy={size + 2}>{value}</tspan>
        </text>
    );
}

function RadarDotMarker({ cx, cy, index, dataPoint, radarVisible }) {
    if (!radarVisible) return null;
    const item = dataPoint?.[index];
    if (!item) return null;
    return (
        <circle
            cx={cx}
            cy={cy}
            r={5}
            fill={getStatusColor(item.level)}
            stroke="#fff"
            strokeWidth={1}
        />
    );
}

export default function Grafik() {
    const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID || "device-001";
    const { automation } = useAutomationApi(deviceId, { pollMs: 0 });
    const liveEnabled = automation?.live_enable === true;
    const { sensor } = useLiveSensorApi(deviceId, { pollMs: 2000, liveEnabled });

    const [lastSensor, setLastSensor] = useState(null);
    const sensorConfig = useSensorConfig();

    // Bangun parameter radar secara dinamis berdasarkan sensorConfig
    const dynamicParameters = useMemo(() => {
        if (!sensorConfig) return [];
        return [
            {
                id: 1,
                parameter: "Cahaya",
                subjudul: "Digital",
                getValue: (s) => s.lux,
                min: sensorConfig.lux.min,
                max: sensorConfig.lux.max,
                satuan: sensorConfig.lux.unit,
            },
            {
                id: 2,
                parameter: "Suhu Udara",
                subjudul: "Digital",
                getValue: (s) => s.temp2,
                min: sensorConfig.temp2.min,
                max: sensorConfig.temp2.max,
                satuan: sensorConfig.temp2.unit,
            },
            {
                id: 3,
                parameter: "Kelembapan Udara",
                subjudul: "DHT22",
                getValue: (s) => s.air_hum,
                min: sensorConfig.air_hum.min,
                max: sensorConfig.air_hum.max,
                satuan: sensorConfig.air_hum.unit,
            },
            {
                id: 4,
                parameter: "TDS",
                subjudul: "TDS",
                getValue: (s) => s.tds,
                min: sensorConfig.tds.min,
                max: sensorConfig.tds.max,
                satuan: sensorConfig.tds.unit,
            },
            {
                id: 5,
                parameter: "Kelembaban Tanah",
                subjudul: "Soil Capacitive",
                getValue: (s) => s.soil_moisture1,
                min: sensorConfig.soil_moisture1.min,
                max: sensorConfig.soil_moisture1.max,
                satuan: sensorConfig.soil_moisture1.unit,
            },
            {
                id: 6,
                parameter: "Suhu Tanah",
                subjudul: "Digital",
                getValue: (s) => s.temp1,
                min: sensorConfig.temp1.min,
                max: sensorConfig.temp1.max,
                satuan: sensorConfig.temp1.unit,
            }
        ];
    }, [sensorConfig]);

    useEffect(() => {
        if (sensor) setLastSensor(sensor);
    }, [sensor]);

    const dataPoint = useMemo(() => buildRadarData(lastSensor, dynamicParameters), [lastSensor, dynamicParameters]);
    const hasSensor = Boolean(lastSensor);
    const radarVisible = liveEnabled && hasSensor;
    const windowWidth = useWindowWidth();

    const renderTick = (tickProps) => (
        <RadarTickLabel
            {...tickProps}
            dataPoint={dataPoint}
            radarVisible={radarVisible}
            windowWidth={windowWidth}
        />
    );
    const renderDot = (dotProps) => (
        <RadarDotMarker
            {...dotProps}
            dataPoint={dataPoint}
            radarVisible={radarVisible}
        />
    );

    return (
        <div className="bg-white shadow-md rounded-xl p-4 text-center border border-black/10">
            <h2 className="text-md font-semibold mb-2">Live Data</h2>
            <div className="text-xs text-slate-500 mb-3">
                Last sync:{" "}
                {liveEnabled && sensor?.sensor_ts
                    ? formatTimestamp(sensor.sensor_ts)
                    : "-"}
            </div>
            <StatusLegend />
            <div className="w-full h-64 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                        data={dataPoint}
                        outerRadius={windowWidth < 768 ? "60%" : "70%"}
                    >
                        <PolarGrid
                            radialLines={false}
                            stroke="rgba(0,177,160,0.8)"
                        />
                        <PolarRadiusAxis
                            domain={[0, 3]}
                            ticks={[0, 1, 2, 3]}
                            tick={false}
                            axisLine={false}
                        />
                        <PolarAngleAxis
                            dataKey="parameter"
                            tick={renderTick}
                        />
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