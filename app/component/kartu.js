import { useLiveSensorApi } from "../hook/useApiDevice";
import { getLevel, getStatusLabel, getStatusColor, SENSOR_CONFIG } from "../utils/sensorUtils";


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
    0: "bg-slate-50",
    1: "bg-amber-50",
    2: "bg-teal-50",
    3: "bg-red-50"
  }[level];

  const innerBgClass = {
    0: "bg-slate-100",
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
      {Icon && (
        <Icon className="absolute opacity-10 pointer-events-none" size={120} style={{ bottom: -20, left: -20 }} color={ringColor} />
      )}

      <div className="text-center mb-3 z-10">
        <div className="font-bold text-slate-800">{parameter}</div>
        <div className="text-[10px] uppercase opacity-70 tracking-widest my-2">{subjudul}</div>
      </div>

      <div
        className="relative w-28 h-28 rounded-full flex items-center justify-center z-10 shadow-inner bg-white/50"
        style={{ background: ringBackground }}>
        <div className={`absolute w-24 h-24 rounded-full flex flex-col items-center justify-center ${innerBgClass} shadow-md`}>
          {level === 0 ? (
            <div className="text-base font-black text-slate-600 tracking-tighter">ERROR</div>
          ) : (
            <div className={`${satuan === " Lux" ? "text-base" : "text-xl"} font-bold text-slate-800`}>
              {nilai}<span className="text-xs ml-0.5">{satuan}</span>
            </div>
          )}
          <div className="text-[10px] items-center justify-center font-black uppercase tracking-tighter opacity-70 px-2 py-1">
            {statusLabel}
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-between w-full px-4 text-[12px] font-bold z-10 text-slate-700/85">
        <div className="text-center">
          <div className="text-xs">{min}{satuan}</div>MIN
        </div>
        <div className="text-center">
          <div className="text-xs">{max}{satuan}</div>MAX
        </div>
      </div>
    </div>
  );
}

