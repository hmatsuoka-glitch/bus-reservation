"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Invitation {
  id: string;
  roomId: string;
  room: {
    id: string;
    name: string;
    description: string | null;
    owner: { nickname: string | null; email: string };
  };
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const router = useRouter();

  const fetchInvitations = () => {
    fetch("/api/rooms/invitations")
      .then((r) => r.json())
      .then((data) => {
        setInvitations(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchInvitations(); }, []);

  const handleAccept = async (inv: Invitation) => {
    setProcessing(inv.id);
    await fetch(`/api/rooms/${inv.roomId}/invitations/${inv.id}/accept`, { method: "POST" });
    router.push(`/rooms/${inv.roomId}`);
  };

  const handleDecline = async (inv: Invitation) => {
    if (!confirm("この招待を辞退しますか？")) return;
    setProcessing(inv.id);
    await fetch(`/api/rooms/${inv.roomId}/members/${inv.id}`, { method: "DELETE" });
    setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
    setProcessing(null);
  };

  if (loading) return (
    <div className="pt-2 space-y-3">
      <div className="h-8 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  );

  return (
    <div className="pt-2 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-800 text-lg">ルームの招待</h1>
      </div>

      {invitations.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400 text-sm">招待はありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => {
            const ownerDisplay = inv.room.owner.nickname || inv.room.owner.email;
            return (
              <div key={inv.id} className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">{inv.room.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{inv.room.name}</p>
                    {inv.room.description && <p className="text-xs text-gray-500 truncate">{inv.room.description}</p>}
                    <p className="text-xs text-gray-400">{ownerDisplay} から招待</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(inv)}
                    disabled={processing === inv.id}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                  >
                    {processing === inv.id ? "..." : "参加する"}
                  </button>
                  <button
                    onClick={() => handleDecline(inv)}
                    disabled={processing === inv.id}
                    className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium disabled:opacity-50"
                  >
                    辞退
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
