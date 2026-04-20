// Ambang batas min/max
export const ambangBatas = {
  cahaya: { min: 10000, max: 20000, satuan: "Lx" },
  suhuUdara: { min: 16, max: 32, satuan: "°C" },
  kelembabanUdara: { min: 60, max: 80, satuan: "%" },
  kelembabanTanah: { min: 60, max: 80, satuan: "%" },
  suhuTanah: { min: 15, max: 30, satuan: "°C" },
};

export function getLevel(value, min, max) {
  if (value < min) return 1;
  if (value > max) return 3;
  return 2;
}

export function getStatusLabel(level) {
  const labels = { 1: "Rendah", 2: "Optimal", 3: "Tinggi" };
  return labels[level] || "-";
}

export function getStatusColor(level) {
  const colors = {
    1: "#FD9A00",
    2: "#00BBA8",
    3: "#FB2C36",
  };
  return colors[level] || "#999";
}

export function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
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
