import dataSensor from "../hook/datasensor"; 

export default function ModulSensor() {
  return dataSensor.map((d) => (
    <SensorBlock
      key={d.id}
      parameter={d.parameter}
      subjudul={d.subjudul}
      displayValue={d.displayValue}
    />
  ));
}

function SensorBlock({ parameter, subjudul, displayValue }) {
  return (
    <div className="bg-blue-100 text-blue-900 p-4 rounded-xl shadow-lg flex flex-col justify-between min-h-[140px]">
      
      {/* Bagian Atas: Status Koneksi */}
      <div>
        <span className="flex items-center gap-2 text-xs font-semibold bg-blue-200 text-blue-700 px-3 py-1 rounded-full w-fit">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
          TERHUBUNG
        </span>
      </div>

      {/* Bagian Bawah: Info Sensor dan Data */}
      <div className="flex justify-between items-end gap-2 mt-4">
        {/* Info Teks */}
        <div className="min-w-0"> 
          <h3 className="font-semibold text-lg truncate" title={parameter}>
            {parameter}
          </h3>
          <p className="text-sm opacity-80" title={subjudul}>
            {subjudul}
          </p>
        </div>
        
        {/* Data Nilai Sensor */}
        <div className="bg-white text-blue-900 px-4 py-1.5 rounded-lg text-sm font-bold text-center shrink-0 shadow-sm border border-blue-200 min-w-[80px]">
          {displayValue}
        </div>

      </div>
    </div>
  );
}