"use client";

import { useState, useEffect } from "react";
import {
    Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer
} from "recharts";
import useGrafik from "../hook/useGrafik";
import { getStatusColor } from "./levelLogic";

export default function Grafik() {
    const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID || "device-001";
    const { dataKartu } = useGrafik(deviceId);
    const [width, setWidth] = useState(768);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const renderTick = ({ x, y, index, cx, cy }) => {
        const d = dataKartu[index];
        if (!d) return null;
        const fontSize = width < 640 ? 10 : 12;
        const r = width < 640 ? 16 : 24;
        const maxChars = 8;
        const lineGap = 2;

        const wrapText = (text) => {
            const words = text.split(" ");
            const lines = [];
            let line = "";
            words.forEach(w => {
                if ((line + " " + w).trim().length <= maxChars) line = (line + " " + w).trim();
                else { if (line) lines.push(line); line = w; }
            });
            if (line) lines.push(line);
            return lines;
        };

        const lines = wrapText(d.parameter);
        const angle = Math.atan2(y - cy, x - cx);
        const dx = Math.cos(angle) * r;
        const dy = Math.sin(angle) * r;

        return (
            <text x={x + dx} y={y + dy} textAnchor="middle"
                style={{ fontSize }}
                className="fill-gray-800 font-semibold"
                pointerEvents="none">
                {lines.map((line, i) => (
                    <tspan key={i} x={x + dx} dy={i === 0 ? 0 : fontSize + lineGap}>{line}</tspan>
                ))}
                <tspan x={x + dx} dy={fontSize + lineGap}>{`${d.nilai}${d.satuan}`}</tspan>
            </text>
        );
    };

    const renderDot = ({ cx, cy, index }) => {
        const d = dataKartu[index];
        if (!d) return null;
        return (
            <circle
                key={index}
                cx={cx}
                cy={cy}
                r={5}
                fill={getStatusColor(d.level)}
                stroke="#fff"
                strokeWidth={1} />
        );
    };

    return (
        <div className="bg-white shadow-md rounded-2xl p-4 text-center">
            <h2 className="text-md font-semibold mb-3">Tanamanku</h2>
            <div className="flex justify-center gap-4 mb-2 text-xs md:text-sm">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: "#FD9A00" }} /> Waspada
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: "#00BBA8" }} /> Optimal
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: "#FB2C36" }} /> Bahaya
                </div>
            </div>
            <div className="w-full h-64 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={dataKartu} outerRadius={width < 768 ? "60%" : "70%"}>
                        {/* Grid dengan 4 ring */}
                        <PolarGrid
                            radialLines={false}
                            stroke="rgba(0, 177, 160, 0.8)"
                        />

                        {/* Sumbu radius level 0-3 */}
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
                            strokeWidth={2}
                            fill="#00BBA8"
                            fillOpacity={0.6}
                            dot={renderDot}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
