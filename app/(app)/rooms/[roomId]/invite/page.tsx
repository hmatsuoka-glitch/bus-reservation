"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";

export default function InvitePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/rooms/${roomId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSuccess(true);
        setEmail("");
      } else {
        const data = await res.json();
        setError(data.error || "招待に失敗しました");
      }
    } catch {
      setError("招待に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-2 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-800 text-lg">メンバーを招待</h1>
      </div>

      <div className="bg-white rounded-2xl p-4 space-y-4 border border-gray-100">
        <p className="text-sm text-gray-500">
          招待するユーザーのメールアドレスを入力してください。招待されたユーザーは承認後にルームに参加できます。
        </p>

        {success && (
          <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-700 font-medium">招待を送信しました</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 rounded-xl p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            placeholder="example@email.com"
          />
        </div>

        <button
          onClick={handleInvite}
          disabled={!email.trim() || loading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {loading ? "送信中..." : "招待を送る"}
        </button>

        <button onClick={() => router.back()} className="w-full py-2 text-gray-500 text-sm">
          ルームに戻る
        </button>
      </div>
    </div>
  );
}
