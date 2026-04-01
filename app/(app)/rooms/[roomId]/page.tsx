"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface Member {
  id: string;
  userId: string;
  status: string;
  user: { id: string; nickname: string | null; email: string };
}

interface Reservation {
  id: string;
  busCompany: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string | null;
  departureStop: string;
  arrivalStop: string;
  seatNumber: string | null;
}

interface SharedReservation {
  id: string;
  reservationId: string;
  sharedBy: string;
  reservation: Reservation;
}

interface Room {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  isOwner: boolean;
  owner: { id: string; nickname: string | null; email: string };
  members: Member[];
  pendingInvitations: Member[];
}

export default function RoomDetailPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const [room, setRoom] = useState<Room | null>(null);
  const [reservations, setReservations] = useState<SharedReservation[]>([]);
  const [tab, setTab] = useState<"reservations" | "members">("reservations");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchData = () => {
    Promise.all([
      fetch(`/api/rooms/${roomId}`).then((r) => r.json()),
      fetch(`/api/rooms/${roomId}/reservations`).then((r) => r.json()),
    ]).then(([roomData, resData]) => {
      if (roomData.error) { setError(roomData.error); setLoading(false); return; }
      setRoom(roomData);
      setReservations(Array.isArray(resData) ? resData : []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, [roomId]);

  const handleAcceptInvitation = async (memberId: string) => {
    await fetch(`/api/rooms/${roomId}/invitations/${memberId}/accept`, { method: "POST" });
    fetchData();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("このメンバーをルームから削除しますか？")) return;
    await fetch(`/api/rooms/${roomId}/members/${memberId}`, { method: "DELETE" });
    fetchData();
  };

  const handleLeave = async () => {
    if (!room) return;
    const myMember = room.members.find((m) => m.user.id !== room.ownerId);
    if (!confirm("このルームから退室しますか？")) return;
    if (myMember) {
      await fetch(`/api/rooms/${roomId}/members/${myMember.id}`, { method: "DELETE" });
    }
    router.push("/rooms");
  };

  const handleRemoveReservation = async (reservationId: string) => {
    if (!confirm("この予約の共有を解除しますか？")) return;
    await fetch(`/api/rooms/${roomId}/reservations/${reservationId}`, { method: "DELETE" });
    setReservations((prev) => prev.filter((r) => r.reservationId !== reservationId));
  };

  if (loading) return (
    <div className="pt-2 space-y-4">
      <div className="h-8 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  );

  if (error) return (
    <div className="pt-2">
      <div className="bg-red-50 rounded-2xl p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button onClick={() => router.back()} className="mt-3 text-blue-600 text-sm">戻る</button>
      </div>
    </div>
  );

  if (!room) return null;

  return (
    <div className="pt-2 space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-gray-800 text-lg truncate">{room.name}</h1>
          {room.description && <p className="text-xs text-gray-500 truncate">{room.description}</p>}
        </div>
        {!room.isOwner && (
          <button onClick={handleLeave} className="text-xs text-red-500 border border-red-200 rounded-lg px-2 py-1">退室</button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
        <button
          onClick={() => setTab("reservations")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "reservations" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
        >
          予約 ({reservations.length})
        </button>
        <button
          onClick={() => setTab("members")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "members" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
        >
          メンバー ({room.members.length + 1})
        </button>
      </div>

      {/* Reservations tab */}
      {tab === "reservations" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link href={`/rooms/${roomId}/share`} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              予約を共有
            </Link>
          </div>

          {reservations.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-sm">共有された予約はありません</p>
            </div>
          ) : (
            reservations.map((sr) => {
              const r = sr.reservation;
              const date = new Date(r.departureDate + "T00:00:00");
              return (
                <div key={sr.id} className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{r.busCompany}</p>
                      <p className="text-sm text-gray-500">
                        {format(date, "M月d日(E)", { locale: ja })} {r.departureTime}
                        {r.arrivalTime && ` → ${r.arrivalTime}`}
                      </p>
                    </div>
                    {(room.isOwner || sr.sharedBy === room.ownerId) && (
                      <button onClick={() => handleRemoveReservation(r.id)} className="text-gray-300 hover:text-red-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg text-xs">{r.departureStop}</span>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-lg text-xs">{r.arrivalStop}</span>
                    {r.seatNumber && <span className="text-xs text-gray-400">座席 {r.seatNumber}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Members tab */}
      {tab === "members" && (
        <div className="space-y-3">
          {room.isOwner && (
            <div className="flex justify-end">
              <Link href={`/rooms/${roomId}/invite`} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                招待する
              </Link>
            </div>
          )}

          {/* Owner */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">メンバー</p>
            <MemberRow user={room.owner} badge="オーナー" />
            {room.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <MemberRow user={m.user} />
                {room.isOwner && (
                  <button onClick={() => handleRemoveMember(m.id)} className="text-xs text-red-400 hover:text-red-600 ml-2">削除</button>
                )}
              </div>
            ))}
          </div>

          {/* Pending invitations (owner only) */}
          {room.isOwner && room.pendingInvitations.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3">招待中</p>
              {room.pendingInvitations.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 font-bold text-sm">
                        {(m.user.nickname || m.user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{m.user.nickname || m.user.email}</p>
                      {m.user.nickname && <p className="text-xs text-gray-400">{m.user.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">招待中</span>
                    <button onClick={() => handleAcceptInvitation(m.id)} className="text-xs text-red-400 hover:text-red-600">取消</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MemberRow({ user, badge }: { user: { nickname: string | null; email: string }; badge?: string }) {
  const display = user.nickname || user.email;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-blue-600 font-bold text-sm">{display.charAt(0).toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate">{display}</p>
        {user.nickname && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
      </div>
      {badge && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">{badge}</span>}
    </div>
  );
}
