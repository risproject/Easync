"use client";

import { useMemo } from "react";
import { useAutomationApi } from "../hook/useApiDevice";
import { FaTemperatureHalf, FaDroplet, FaFlask, FaCircleCheck } from "react-icons/fa6";
import { RiSunLine } from "react-icons/ri";

// Konfigurasi Central untuk seluruh sensor
export const SENSOR_CONFIG = {
  soil_moisture1: {
    label: "Kelembapan Tanah 1",
    sub: "Soil Moisture Sensor",
    unit: "%",
    min: 52,
    max: 75,
    maxLimit: 100,
    color: "#0d9488",
    icon: FaDroplet
  },
  soil_moisture2: {
    label: "Kelembapan Tanah 2",
    sub: "Soil Moisture Sensor",
    unit: "%",
    min: 52,
    max: 75,
    maxLimit: 100,
    color: "#14b8a6",
    icon: FaDroplet
  },
  air_temp: {
    label: "Engine Temp",
    sub: "AHT10",
    unit: "°C",
    min: 15,
    max: 30,
    maxLimit: 50,
    color: "#3b82f6",
    icon: FaTemperatureHalf
  },
  air_hum: {
    label: "Kelembapan Udara",
    sub: "AHT10",
    unit: "%",
    min: 50,
    max: 80,
    maxLimit: 100,
    color: "#3b82f6",
    icon: FaDroplet
  },
  temp1: {
    label: "Suhu Tanah",
    sub: "DS18B20",
    unit: "°C",
    min: 15,
    max: 30,
    maxLimit: 50,
    color: "#8b5cf6",
    icon: FaTemperatureHalf
  },
  temp2: {
    label: "Suhu Udara",
    sub: "DS18B20",
    unit: "°C",
    min: 15,
    max: 30,
    maxLimit: 50,
    color: "#a855f7",
    icon: FaTemperatureHalf
  },
  lux: {
    label: "Intensitas Cahaya",
    sub: "BH1750",
    unit: " Lux",
    min: 10000,
    max: 30000,
    maxLimit: 50000,
    color: "#f59e0b",
    icon: RiSunLine
  },
  tds: {
    label: "Padatan Terlarut (TDS)",
    sub: "Gravity V1",
    unit: " ppm",
    min: 100,
    max: 700,
    maxLimit: 1000,
    color: "#ef4444",
    icon: FaFlask
  },
};

export const SENSOR_LIST = Object.entries(SENSOR_CONFIG).map(([key, value]) => ({
  key,
  ...value,
}));


export function getLevel(value, min, max) {
  if (value === -1 || value === -2) return 0;
  if (value < min) return 1;
  if (value > max) return 3;
  return 2;
}

export function getStatusLabel(level) {
  const labels = { 0: "Offline", 1: "Rendah", 2: "Optimal", 3: "Tinggi" };
  return labels[level] || "-";
}

export function getStatusColor(level) {
  const colors = {
    0: "#94a3b8",
    1: "#FD9A00",
    2: "#00BBA8",
    3: "#FB2C36",
  };
  return colors[level] || "#999";
}


export function formatTimestamp(ts) {
  if (!ts) return "-";
  const date = new Date(String(ts).replace(" ", "T"));
  date.setTime(date.getTime() + 7 * 60 * 60 * 1000);
  const d = String(date.getUTCDate()).padStart(2, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const y = String(date.getUTCFullYear()).slice(2);
  const h = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  const s = String(date.getUTCSeconds()).padStart(2, "0");
  return `${d}/${m}/${y} - ${h}:${min}:${s}`;
}

export function mergeSensorConfig(baseConfig, automation) {
  if (!automation) return baseConfig;
  return {
    ...baseConfig,
    soil_moisture1: {
      ...baseConfig.soil_moisture1,
      min: Number(automation.soil_min) || baseConfig.soil_moisture1.min,
      max: Number(automation.soil_max) || baseConfig.soil_moisture1.max,
    },
    soil_moisture2: {
      ...baseConfig.soil_moisture2,
      min: Number(automation.soil_min) || baseConfig.soil_moisture2.min,
      max: Number(automation.soil_max) || baseConfig.soil_moisture2.max,
    },
  };
}

export function useSensorConfig() {
  const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID || "device-001";
  const { automation } = useAutomationApi(deviceId, { pollMs: 0 });

  return useMemo(() => {
    return mergeSensorConfig(SENSOR_CONFIG, automation);
  }, [automation]);
}
