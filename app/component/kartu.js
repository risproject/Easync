import { useLiveSensorApi } from "../hook/useApiDevice";
import { getLevel, getStatusLabel, getStatusColor } from "../utils/sensorUtils";
import { FaTemperatureHalf, FaDroplet, FaFlask } from "react-icons/fa6";
import { RiSunLine } from "react-icons/ri";

// konfigurasi tampilan kartu
const SENSOR_CONFIG = {
  soil_moisture1: { label: "Kelembaban Tanah 1", sub: "Soil Moisture 1", unit: "%", min: 60, max: 80, icon: FaDroplet },
  soil_moisture2: { label: "Kelembaban Tanah 2", sub: "Soil Moisture 2", unit: "%", min: 60, max: 80, icon: FaDroplet },
  air_temp: { label: "Suhu Udara", sub: "Air Temp", unit: "°C", min: 18, max: 35, icon: FaTemperatureHalf },
  air_hum: { label: "Kelembaban Udara", sub: "Air Humidity", unit: "%", min: 60, max: 80, icon: FaDroplet },
  temp1: { label: "Suhu Air 1", sub: "Water Temp 1", unit: "°C", min: 20, max: 30, icon: FaTemperatureHalf },
  temp2: { label: "Suhu Air 2", sub: "Water Temp 2", unit: "°C", min: 20, max: 30, icon: FaTemperatureHalf },
  lux: { label: "Intensitas Cahaya", sub: "Light Level", unit: " Lx", min: 1500, max: 4000, icon: RiSunLine },
  tds: { label: "Tingkat TDS", sub: "Nutrient Level", unit: " ppm", min: 500, max: 1200, icon: FaFlask },
};

export default function Kartu() {
  const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID || "device-001";
  const { sensor } = useLiveSensorApi(deviceId);

  if (!sensor) return null;

  // Siapkan data seluruh sensor (8 parameter)
  const dataList = Object.entries(SENSOR_CONFIG).map(([key, config]) => {
    const nilai = sensor[key] || 0;
    return {
      parameter: config.label,
      subjudul: config.sub,
      nilai: nilai,
      satuan: config.unit,
      min: config.min,
      max: config.max,
      icon: config.icon,
      level: getLevel(nilai, config.min, config.max)
    };
  });

  return dataList.map((d, i) => <KartuItem key={i} {...d} />);
}

function KartuItem({ parameter, subjudul, nilai, satuan, level, min, max, icon: Icon }) {
  const statusLabel = getStatusLabel(level);
  const ringColor = getStatusColor(level);

  // Warna background kartu mengikuti level
  const cardBgClass = {
    1: "bg-amber-50",
    2: "bg-teal-50",
    3: "bg-red-50"
  }[level];

  const innerBgClass = {
    1: "bg-amber-100",
    2: "bg-teal-100",
    3: "bg-red-100"
  }[level];

  // Hitung progress lingkaran
  const progressPercent = Math.min(Math.max((nilai / (max * 1.2)) * 100, 0), 100);
  const angle = progressPercent * 3.6;
  const ringBackground = `conic-gradient(${ringColor} 0deg ${angle}deg, white ${angle}deg 360deg)`;

  return (
    <div className={`relative border-2 rounded-2xl shadow-md p-4 flex flex-col items-center select-none overflow-hidden ${cardBgClass} transition-all duration-500`}
      style={{ borderColor: ringColor }}>
      {/* WATERMARK IKON BESAR */}
      {Icon && (
        <Icon
          className="absolute opacity-10 pointer-events-none"
          size={120}
          style={{ bottom: -20, left: -20 }}
          color={ringColor}
        />
      )}

      <div className="text-center mb-3 z-10">
        <div className="font-bold text-slate-800">{parameter}</div>
        <div className="text-[10px] uppercase font-bold opacity-40 tracking-widest">{subjudul}</div>
      </div>

      <div
        className="relative w-28 h-28 rounded-full flex items-center justify-center z-10 shadow-inner bg-white/50"
        style={{ background: ringBackground }}>
        <div className={`absolute w-24 h-24 rounded-full flex flex-col items-center justify-center ${innerBgClass} shadow-md`}>
          <div className="text-xl font-bold text-slate-800">{nilai}<span className="text-xs ml-0.5">{satuan}</span></div>
          <div className="text-[10px] items-center justify-center font-black uppercase tracking-tighter opacity-70 px-2 py-0.5 rounded-full border border-black/5 bg-white/20">
            {statusLabel}
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-between w-full px-4 text-[10px] font-bold text-slate-400 z-10">
        <div className="text-center">
          <div className="text-xs text-slate-700">{min}{satuan}</div>MIN
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-700">{max}{satuan}</div>MAX
        </div>
      </div>
    </div>
  );
}

