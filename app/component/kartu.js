"use client";

import useLiveDevice from "../hook/useLiveDevice";
import { getStatusLabel, getStatusColor } from "./levelLogic";
import { FaTemperatureHalf } from "react-icons/fa6";
import { FaHandHoldingWater } from "react-icons/fa";
import { RiSunLine } from "react-icons/ri";

export default function Kartu() {
    const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID || "device-001";
    const { dataKartu } = useLiveDevice(deviceId);
    return dataKartu.map((d, i) => <KartuItem key={i} {...d} />);
}

function KartuItem({ parameter, subjudul, nilai, satuan, level, min, max }) {

    const statusLabel = getStatusLabel(level);
    const ringColor = getStatusColor(level);

    const p = parameter.toLowerCase();

    // Tentukan ikon berdasar jenis parameter
    const Icon =
        p.includes("suhu") || p.includes("temperature") ? FaTemperatureHalf :
            p.includes("kelembaban") || p.includes("humidity") ? FaHandHoldingWater :
                p.includes("cahaya") || p.includes("light") ? RiSunLine :
                    null;

    // Warna background kartu mengikuti level
    const cardBgClass = {
        1: "bg-amber-50",
        2: "bg-teal-50",
        3: "bg-red-50"
    }[level];

    const isCahaya = p.includes("cahaya") || p.includes("light");

    let ringBackground;

    if (isCahaya) {
        if (level === 2) {
            // Cahaya optimal: progress mengikuti min–max
            const rangePercent = Math.min(
                Math.max(((nilai - min) / (max - min)) * 100, 0),
                100
            );
            const angle = rangePercent * 3.6;

            ringBackground = `conic-gradient(${ringColor} 0deg ${angle}deg, white ${angle}deg 360deg)`;
        } else {
            // Level cahaya rendah / bahaya → full solid warna level
            ringBackground = ringColor;
        }
    }
    else {
        // Parameter lain → progress 0–100%
        const percent = Math.min(Math.max((nilai / 100) * 100, 0), 100);
        const angle = percent * 3.6;

        ringBackground = `conic-gradient(${ringColor} 0deg ${angle}deg, white ${angle}deg 360deg)`;
    }

    const innerBgClass = {
        1: "bg-amber-100",
        2: "bg-teal-100",
        3: "bg-red-100"
    }[level];

    return (
        <div
            className={`relative border-2 rounded-2xl shadow-md p-4 flex flex-col items-center select-none overflow-hidden ${cardBgClass}`}
            style={{ borderColor: ringColor }}
        >

            {/* WATERMARK IKON BESAR DI BELAKANG */}
            {Icon && (
                <Icon
                    className="absolute opacity-15 pointer-events-none"
                    size={140}
                    style={{ bottom: -10, left: -10 }}
                    color={ringColor}
                />
            )}

            <div className="text-center mb-3 z-10">
                <div className="font-semibold">{parameter}</div>
                <div className="text-xs opacity-80">{subjudul}</div>
            </div>

            <div
                className="relative w-27 h-27 rounded-full flex items-center justify-center z-10"
                style={{ background: ringBackground }}
            >
                <div className={`absolute w-24 h-24 rounded-full flex flex-col items-center justify-center ${innerBgClass}`}>
                    <div className="text-xl font-semibold">{nilai}{satuan}</div>
                    <div className="text-sm opacity-90">{statusLabel}</div>
                </div>
            </div>

            <div className="mt-4 flex justify-between w-full px-3 text-[11px] opacity-80 z-10">
                <div className="text-center">
                    <div className="text-sm font-semibold">{min}{satuan}</div>Min
                </div>
                <div className="text-center">
                    <div className="text-sm font-semibold">{max}{satuan}</div>Max
                </div>
            </div>
        </div>
    );
}
