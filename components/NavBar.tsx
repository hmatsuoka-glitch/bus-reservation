"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface NavBarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    nickname?: string | null;
  };
}

export function NavBar({ user }: NavBarProps) {
  const pathname = usePathname();
  const displayName = user?.nickname || user?.name || user?.email || "ユーザー";
  const [inviteCount, setInviteCount] = useState(0);

  useEffect(() => {
    fetch("/api/rooms/invitations")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInviteCount(data.length);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-800">BusPass</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xs">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{displayName}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2 py-1"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="max-w-2xl mx-auto h-16 flex items-center">
          {/* Home */}
          <Link
            href="/dashboard"
            className={`flex-1 flex flex-col items-center gap-1 py-1 transition-colors ${
              pathname === "/dashboard" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">ホーム</span>
          </Link>

          {/* Today */}
          <Link
            href="/today"
            className={`flex-1 flex flex-col items-center gap-1 py-1 transition-colors ${
              pathname === "/today" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">今日</span>
          </Link>

          {/* Add reservation */}
          <Link href="/reservations/new" className="flex-1 flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg -mt-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-400 mt-1">追加</span>
          </Link>

          {/* Rooms */}
          <Link
            href="/rooms"
            className={`flex-1 relative flex flex-col items-center gap-1 py-1 transition-colors ${
              pathname.startsWith("/rooms") ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {inviteCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {inviteCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">ルーム</span>
          </Link>

          {/* My page */}
          <Link
            href="/mypage"
            className={`flex-1 flex flex-col items-center gap-1 py-1 transition-colors ${
              pathname === "/mypage" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-medium">マイページ</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
