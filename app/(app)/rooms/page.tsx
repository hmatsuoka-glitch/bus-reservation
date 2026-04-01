"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Room {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  _count: { members: number };
  owner?: { nickname: string | null; email: string };
}

export default function RoomsPage() {
  const [owned, setOwned] = useState<Room[]>([]);
  const [member, setMember] = useState<Room[]>([]);
  const [inviteCount, setInviteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/rooms").then((r) => r.json()),
      fetch("/api/rooms/invitations").then((r) => r.json()),
    ]).then(([rooms, invitations]) => {
      setOwned(rooms.owned || []);
      setMember(rooms.member || []);
      setInviteCount(Array.isArray(invitations) ? invitations.length : 0);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="pt-2 space-y-4">
        <div className="h-8 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="pt-2 space-y-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-gray-800 text-lg">予約管理ルーム</h1>
        <Link
          href="/rooms/new"
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          新規作成
        </Link>
      </div>

      {/* Invitations banner */}
      {inviteCount > 0 && (
        <Link
          href="/rooms/invitations"
          className="block bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">{inviteCount}</span>
          </div>
          <div>
            <p className="font-semibold text-blue-800">{inviteCount}件のルーム招待が届いています</p>
            <p className="text-xs text-blue-600">タップして確認する</p>
          </div>
          <svg className="w-5 h-5 text-blue-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}

      {/* Owned rooms */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">自分のルーム</h2>
        {owned.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">ルームをまだ作成していません</p>
            <Link href="/rooms/new" className="mt-3 inline-block text-blue-600 text-sm font-medium">
              最初のルームを作成する
            </Link>
          </div>
        ) : (
          owned.map((room) => <RoomCard key={room.id} room={room} isOwner onClick={() => router.push(`/rooms/${room.id}`)} />)
        )}
      </section>

      {/* Member rooms */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">参加中のルーム</h2>
        {member.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
            <p className="text-gray-400 text-sm">参加中のルームはありません</p>
          </div>
        ) : (
          member.map((room) => <RoomCard key={room.id} room={room} isOwner={false} onClick={() => router.push(`/rooms/${room.id}`)} />)
        )}
      </section>
    </div>
  );
}

function RoomCard({ room, isOwner, onClick }: { room: Room; isOwner: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full bg-white rounded-2xl p-4 border border-gray-100 text-left flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-lg">{room.name.charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-800 truncate">{room.name}</p>
          {isOwner && (
            <span className="flex-shrink-0 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">オーナー</span>
          )}
        </div>
        {room.description && <p className="text-xs text-gray-500 truncate mt-0.5">{room.description}</p>}
        <p className="text-xs text-gray-400 mt-1">
          {room.owner ? `${room.owner.nickname || room.owner.email} · ` : ""}
          メンバー {room._count.members}人
        </p>
      </div>
      <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
