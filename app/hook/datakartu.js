import { getLevel } from "../component/levelLogic";

const rawData = [
    {
        id: 5,
        parameter: "Cahaya",
        subjudul: "Digital",
        nilai: 3220,
        satuan: "Lx",
        min: 1500,
        max: 4000
    },
    {
        id: 4,
        parameter: "Suhu Udara",
        subjudul: "Dual Chanel",
        nilai: 22,
        satuan: "°C",
        min: 18,
        max: 35
    },
    {
        id: 2,
        parameter: "Kelembaban Udara",
        subjudul: "Dual Chanel",
        nilai: 42,
        satuan: "%",
        min: 60,
        max: 80
    },
    {
        id: 1,
        parameter: "Kelembaban Tanah",
        subjudul: "Dual Chanel",
        nilai: 73,
        satuan: "%",
        min: 60,
        max: 80
    },
    {
        id: 3,
        parameter: "Suhu Tanah",
        subjudul: "Dual Chanel",
        nilai: 19,
        satuan: "°C",
        min: 18,
        max: 35
    },



];

const dataKartu = rawData.map(item => ({
    ...item,
    level: getLevel(item.nilai, item.min, item.max)
}));

export default dataKartu;
