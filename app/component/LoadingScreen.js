"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const increment = prev < 60 ? 5 : prev < 85 ? 2 : 0.5;
        return Math.min(prev + increment, 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center bg-gray-600/90 backdrop-blur-lg animate-in fade-in duration-500">
      <div className="relative flex flex-col items-center">

        {/* Progress Square (Liquid Style) */}
        <div className="relative w-16 h-16 bg-white/10 border border-white/30 rounded-lg overflow-hidden shadow-2xl flex items-center justify-center animate-in zoom-in duration-500">
          <div
            className="absolute bottom-0 left-0 w-full bg-white/30 transition-all duration-300 ease-out"
            style={{ height: `${progress}%` }} />

          <div className="relative z-10 font-light text-white tracking-tight tabular-nums">
            {Math.round(progress)}%
          </div>
        </div>

        <p className="mt-8 font-light text-white tracking-wide animate-pulse">
          Menghubungkan...
        </p>

      </div>
    </div>
  );
}
