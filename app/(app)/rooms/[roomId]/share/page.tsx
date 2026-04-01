"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface Reservation {
  id: string;
  busCompany: string;
  departureDate: string;
  departureTime: string;
  departureStop: string;
  arrivalStop: string;
}

export default function ShareReservationPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/reservations").then((r) => r.json()),
      fetch(`/api/rooms/${roomId}/reservations`).then((r) => r.json()),
    ]).then(([myRes, sharedRes]) => {
      setReservations(Array.isArray(myRes) ? myRes : []);
      const ids = new Set<string>((Array.isArray(sharedRes) ? sharedRes : []).map((s: { reservationId: string }) => s.reservationId));
      setSharedIds(ids);
      setLoading(false);
    });
  }, [roomId]);

  const handleShare = async (reservationId: string) => {
    setSharing(reservationId);
    try {
      const res = await fetch(`/api/rooms/${roomId}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });
      if (res.ok) {
        setSharedIds((prev) => new Set([...prev, reservationId]));
      }
    } finally {
      setSharing(null);
    }
  };

  if (loading) return (
    <div className="pt-2 space-y-3">
      <div className="h-8 bg-gray-100 rounded-xl animate-pulse" />
      {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="pt-2 space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-800 text-lg">予約を共有</h1>
      </div>

      <p className="text-sm text-gray-500 px-1">自分の予約を選んでルームに共有します。</p>

      {reservations.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <p className="text-gray-400">予約がありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => {
            const isShared = sharedIds.has(r.id);
            const date = new Date(r.departureDate + "T00:00:00");
            return (
              <div key={r.id} className={`bg-white rounded-2xl p-4 border flex items-center gap-3 ${isShared ? "border-green-200" : "border-gray-100"}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{r.busCompany}</p>
                  <p className="text-xs text-gray-500">
                    {format(date, "M月d日(E)", { locale: ja })} {r.departureTime}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{r.departureStop} → {r.arrivalStop}</p>
                </div>
                {isShared ? (
                  <span className="flex-shrink-0 text-xs bg-green-100 text-green-600 px-3 py-1.5 rounded-xl font-medium">共有済み</span>
                ) : (
                  <button
                    onClick={() => handleShare(r.id)}
                    disabled={sharing === r.id}
                    className="flex-shrink-0 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-xl font-medium disabled:opacity-50"
                  >
                    {sharing === r.id ? "..." : "共有"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
