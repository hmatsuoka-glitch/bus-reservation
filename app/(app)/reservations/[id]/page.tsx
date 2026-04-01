"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { MapView } from "@/components/MapView";

interface Reservation {
  id: string;
  busCompany: string;
  bookingNumber: string;
  passengerName: string;
  departureDate: string;
  departureTime: string;
  arrivalTime?: string;
  departureStop: string;
  arrivalStop: string;
  departureLat?: number;
  departureLng?: number;
  seatNumber?: string;
  qrCodeData?: string;
  boardingPassUrl?: string;
  status: string;
  notes?: string;
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "yyyy年M月d日（E）", { locale: ja });
  } catch {
    return dateStr;
  }
}

export default function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "qr" | "map">("info");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setReservation(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("この予約を削除しますか？")) return;
    setDeleting(true);
    await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="pt-4 space-y-4">
        <div className="bg-white rounded-2xl p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="pt-4 text-center">
        <p className="text-gray-500">予約が見つかりません</p>
      </div>
    );
  }

  return (
    <div className="pt-2 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-800 text-lg">予約詳細</h1>
        </div>
        <button onClick={handleDelete} disabled={deleting} className="text-red-400 hover:text-red-600 text-sm">
          削除
        </button>
      </div>

      {/* Boarding Pass Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

        <div className="relative">
          <div className="text-xs font-medium opacity-80 mb-1">{reservation.busCompany}</div>
          <div className="text-xs opacity-70 mb-4">予約番号: {reservation.bookingNumber}</div>

          {/* Route */}
          <div className="flex items-center gap-3 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{reservation.departureTime}</div>
              <div className="text-sm opacity-80 mt-1 max-w-[100px] leading-tight">{reservation.departureStop}</div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <svg className="w-6 h-6 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              {reservation.arrivalTime && (
                <span className="text-xs opacity-60 mt-1">→ {reservation.arrivalTime}</span>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{reservation.arrivalTime || "--:--"}</div>
              <div className="text-sm opacity-80 mt-1 max-w-[100px] leading-tight">{reservation.arrivalStop}</div>
            </div>
          </div>

          {/* Bottom info */}
          <div className="border-t border-white/20 pt-3 flex items-center justify-between">
            <div>
              <div className="text-xs opacity-70">乗車日</div>
              <div className="font-semibold text-sm">{formatDate(reservation.departureDate)}</div>
            </div>
            {reservation.seatNumber && (
              <div className="text-center">
                <div className="text-xs opacity-70">座席</div>
                <div className="font-bold text-xl">{reservation.seatNumber}</div>
              </div>
            )}
            <div className="text-right">
              <div className="text-xs opacity-70">氏名</div>
              <div className="font-semibold text-sm">{reservation.passengerName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
        <div className="flex border-b border-gray-100">
          {(["info", "qr", "map"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500"
              }`}
            >
              {tab === "info" ? "詳細情報" : tab === "qr" ? "QR・搭乗券" : "乗り場マップ"}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === "info" && (
            <div className="space-y-4">
              {[
                { label: "バス会社", value: reservation.busCompany },
                { label: "予約番号", value: reservation.bookingNumber },
                { label: "氏名", value: reservation.passengerName },
                { label: "出発日", value: formatDate(reservation.departureDate) },
                { label: "出発時刻", value: reservation.departureTime },
                { label: "到着時刻", value: reservation.arrivalTime || "-" },
                { label: "出発停留所", value: reservation.departureStop },
                { label: "到着停留所", value: reservation.arrivalStop },
                { label: "座席番号", value: reservation.seatNumber || "-" },
                { label: "メモ", value: reservation.notes || "-" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500 flex-shrink-0 w-28">{label}</span>
                  <span className="text-sm font-medium text-gray-800 text-right">{value}</span>
                </div>
              ))}
              <button
                onClick={() => router.push(`/reservations/${id}/edit`)}
                className="w-full py-3 border-2 border-blue-200 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors"
              >
                編集する
              </button>
            </div>
          )}

          {activeTab === "qr" && (
            <QRCodeDisplay
              qrCodeData={reservation.qrCodeData}
              boardingPassUrl={reservation.boardingPassUrl}
              bookingNumber={reservation.bookingNumber}
            />
          )}

          {activeTab === "map" && (
            <MapView
              lat={reservation.departureLat}
              lng={reservation.departureLng}
              stopName={reservation.departureStop}
            />
          )}
        </div>
      </div>

      {/* Notes */}
      {reservation.notes && (
        <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-sm font-medium text-yellow-800">メモ</span>
          </div>
          <p className="text-sm text-yellow-700">{reservation.notes}</p>
        </div>
      )}
    </div>
  );
}
