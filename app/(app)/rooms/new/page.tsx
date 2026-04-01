"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewRoomPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        const room = await res.json();
        router.push(`/rooms/${room.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "作成に失敗しました");
      }
    } catch {
      setError("作成に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base";

  return (
    <div className="pt-2 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-800 text-lg">ルームを作成</h1>
      </div>

      <div className="bg-white rounded-2xl p-4 space-y-4 border border-gray-100">
        <p className="text-sm text-gray-500">
          招待した人だけが予約情報を確認できるプライベートルームを作成します。
        </p>

        {error && (
          <div className="bg-red-50 rounded-xl p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ルーム名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 30))}
            className={inputClass}
            placeholder="例：大阪旅行グループ"
            maxLength={30}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{name.length}/30</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">説明（任意）</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 200))}
            className={`${inputClass} h-24 resize-none`}
            placeholder="このルームについての説明を入力..."
            maxLength={200}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/200</p>
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim() || saving}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {saving ? "作成中..." : "ルームを作成する"}
        </button>
      </div>
    </div>
  );
}
