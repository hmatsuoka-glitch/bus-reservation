"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, isPast, isToday, isTomorrow, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

interface Reservation {
  id: string;
  busCompany: string;
  departureDate: string;
  departureTime: string;
  arrivalTime?: string;
  departureStop: string;
  arrivalStop: string;
  seatNumber?: string;
  bookingNumber: string;
  status: string;
}

function getStatusBadge(reservation: Reservation) {
  const dateStr = reservation.departureDate;
  try {
    const date = parseISO(dateStr);
    if (isPast(date) && !isToday(date)) {
      return { label: "完了", color: "bg-gray-100 text-gray-500" };
    }
    if (isToday(date)) {
      return { label: "今日", color: "bg-green-100 text-green-700" };
    }
    if (isTomorrow(date)) {
      return { label: "明日", color: "bg-yellow-100 text-yellow-700" };
    }
    return { label: "予定", color: "bg-blue-100 text-blue-700" };
  } catch {
    return { label: "予定", color: "bg-blue-100 text-blue-700" };
  }
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "M月d日（E）", { locale: ja });
  } catch {
    return dateStr;
  }
}

export default function DashboardPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "all">("upcoming");

  useEffect(() => {
    fetch("/api/reservations")
      .then((r) => r.json())
      .then((data) => {
        setReservations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = reservations.filter((r) => {
    if (filter === "all") return true;
    try {
      const date = parseISO(r.departureDate);
      return !isPast(date) || isToday(date);
    } catch {
      return true;
    }
  });

  const todayRes = reservations.filter((r) => {
    try { return isToday(parseISO(r.departureDate)); } catch { return false; }
  });

  return (
    <div className="space-y-4 pt-2">
      {/* Today's alert */}
      {todayRes.length > 0 && (
        <div className="bg-green-500 text-white rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold">今日の乗車</span>
          </div>
          {todayRes.map((r) => (
            <Link key={r.id} href={`/reservations/${r.id}`}>
              <div className="bg-white/20 rounded-xl p-3 hover:bg-white/30 transition-colors">
                <div className="font-semibold">{r.departureStop} → {r.arrivalStop}</div>
                <div className="text-sm opacity-90">{r.departureTime} 出発 {r.seatNumber && `・座席 ${r.seatNumber}`}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("upcoming")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === "upcoming"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          予定
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          すべて
        </button>
      </div>

      {/* Reservations list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">予約がありません</p>
          <p className="text-gray-400 text-sm mt-1">＋ボタンから予約を追加してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const badge = getStatusBadge(r);
            return (
              <Link key={r.id} href={`/reservations/${r.id}`}>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all active:scale-98">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{r.busCompany}</span>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-gray-800 text-base">{r.departureStop}</span>
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="font-bold text-gray-800 text-base">{r.arrivalStop}</span>
                  </div>

                  {/* Info row */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(r.departureDate)}
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {r.departureTime}
                    </div>
                    {r.seatNumber && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7M12 3v18" />
                        </svg>
                        {r.seatNumber}席
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
