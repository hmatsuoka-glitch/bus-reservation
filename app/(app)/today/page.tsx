"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, isToday, parseISO } from "date-fns";
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

export default function TodayPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reservations")
      .then((r) => r.json())
      .then((data) => {
        setReservations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const todayRes = reservations.filter((r) => {
    try {
      return isToday(parseISO(r.departureDate));
    } catch {
      return false;
    }
  });

  const todayLabel = format(new Date(), "M月d日（E）", { locale: ja });

  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className="bg-green-500 text-white rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold text-lg">今日の予定</span>
        </div>
        <div className="text-sm opacity-90">{todayLabel}</div>
      </div>

      {/* Reservations list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : todayRes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">今日の予定はありません</p>
          <p className="text-gray-400 text-sm mt-1">ゆっくりお過ごしください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayRes.map((r) => (
            <Link key={r.id} href={`/reservations/${r.id}`}>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all active:scale-98">
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    今日
                  </span>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {r.departureTime} 出発
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
          ))}
        </div>
      )}
    </div>
  );
}
