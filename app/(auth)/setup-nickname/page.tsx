"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

export default function SetupNicknamePage() {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      let data;
      try { data = await res.json(); } catch { throw new Error("サーバーエラー"); }

      if (res.ok) {
        // Force session refresh then go to dashboard
        await signIn("credentials", { redirect: false });
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data?.error || "保存に失敗しました");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">もう少しで完了！</h1>
          <p className="text-blue-200 text-sm mt-1">システム内で表示する名前を設定してください</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">ニックネームを設定</h2>
          <p className="text-sm text-gray-500 mb-5">
            アプリ内で表示される名前です。本名でなくてOK！
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ニックネーム</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                placeholder="たろう・Taro・T.M など"
                maxLength={20}
                required
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{nickname.length}/20文字</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-blue-600">
                💡 このニックネームは予約一覧など画面上部に表示されます。後から変更もできます。
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !nickname.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "保存中..." : "ニックネームを設定してはじめる →"}
            </button>
          </form>

          {session && (
            <p className="mt-4 text-center">
              <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
                後で設定する
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
