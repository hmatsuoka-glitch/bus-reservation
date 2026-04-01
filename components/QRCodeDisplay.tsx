"use client";

import { useEffect, useRef } from "react";

interface QRCodeDisplayProps {
  qrCodeData?: string | null;
  boardingPassUrl?: string | null;
  bookingNumber: string;
}

export function QRCodeDisplay({
  qrCodeData,
  boardingPassUrl,
  bookingNumber,
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const data = qrCodeData || bookingNumber;
    if (!data || !canvasRef.current) return;

    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current!, data, {
        width: 250,
        margin: 2,
        color: { dark: "#1e3a5f", light: "#ffffff" },
      });
    });
  }, [qrCodeData, bookingNumber]);

  return (
    <div className="space-y-4">
      {/* QR Code */}
      <div className="flex flex-col items-center">
        <div className="bg-white p-4 rounded-2xl shadow-inner border-2 border-gray-100">
          <canvas ref={canvasRef} className="rounded-lg" />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {qrCodeData ? "予約QRコード" : `予約番号: ${bookingNumber}`}
        </p>
      </div>

      {/* Brightness tip */}
      <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p className="text-xs text-blue-600">QRコード読み取り時は画面の明るさを最大にしてください</p>
      </div>

      {/* Boarding pass link */}
      {boardingPassUrl && (
        <a
          href={boardingPassUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          搭乗券を開く
        </a>
      )}
    </div>
  );
}
