"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function MyPage() {
  const { data: session, update } = useSession();
  const [nickname, setNickname] = useState(session?.user?.nickname || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/user/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      let data;
      try { data = await res.json(); } catch { throw new Error("サーバーエラー"); }

      if (res.ok) {
        await update({ nickname: nickname.trim() });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      } else {
        setError(data?.error || "保存に失敗しました");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const displayName = session?.user?.nickname || session?.user?.email || "";

  return (
    <div className="pt-2 space-y-4">
      <h1 className="font-bold text-gray-800 text-lg">マイページ</h1>

      {/* Profile card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-bold text-xl">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-bold text-gray-800 text-lg">{session?.user?.nickname || "未設定"}</div>
            <div className="text-sm text-gray-500">{session?.user?.email}</div>
          </div>
        </div>

        <form onSubmit={handleSaveNickname} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ニックネーム変更</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ニックネームを入力"
              maxLength={20}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{nickname.length}/20文字</p>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving || !nickname.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {saving ? "保存中..." : saved ? "✓ 保存しました" : "ニックネームを変更"}
          </button>
        </form>
      </div>

      {/* Biometric setup */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-1">生体認証</h2>
        <p className="text-sm text-gray-500 mb-3">Face ID / Touch ID でログインできるように設定します</p>
        <a
          href="/setup-passkey"
          className="block w-full py-3 border-2 border-blue-200 text-blue-600 rounded-xl font-medium text-center hover:bg-blue-50 transition-colors"
        >
          生体認証を設定する
        </a>
      </div>

      {/* Logout */}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
      >
        ログアウト
      </button>
    </div>
  );
}
