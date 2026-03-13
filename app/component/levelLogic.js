// Menghitung level berdasarkan nilai terhadap batas
export const getLevel = (value, min, max) => {
    if (value < min) return 1;   // Rendah
    if (value > max) return 3;   // Tinggi
    return 2;                    // Normal
};

// Label status berdasarkan level
export const getStatusLabel = (level) => ({
    1: "Rendah",
    2: "Normal",
    3: "Tinggi"
}[level]);

// Warna status berdasarkan level (untuk kartu atau titik radar)
export const getStatusColor = (level) => ({
    1: "#FD9A00", // Amber (Waspada)
    2: "#00BBA8", // Hijau (Normal)
    3: "#FB2C36"  // Merah (Bahaya)
}[level]);
