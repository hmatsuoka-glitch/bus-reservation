"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Tab = "file" | "manual";

interface FormData {
  busCompany: string;
  bookingNumber: string;
  passengerName: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  departureStop: string;
  arrivalStop: string;
  seatNumber: string;
  qrCodeData: string;
  boardingPassUrl: string;
  departureLat: string;
  departureLng: string;
  notes: string;
  rawEmailContent: string;
}

interface FileEntry {
  id: string;
  file: File;
  previewUrl: string | null;
}

const INITIAL_FORM: FormData = {
  busCompany: "", bookingNumber: "", passengerName: "",
  departureDate: "", departureTime: "", arrivalTime: "",
  departureStop: "", arrivalStop: "", seatNumber: "",
  qrCodeData: "", boardingPassUrl: "",
  departureLat: "", departureLng: "", notes: "", rawEmailContent: "",
};

const PARSEABLE_FIELDS: (keyof FormData)[] = [
  "busCompany", "bookingNumber", "passengerName",
  "departureDate", "departureTime", "arrivalTime",
  "departureStop", "arrivalStop", "seatNumber",
];

export default function NewReservationPage() {
  const [tab, setTab] = useState<Tab>("file");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"input" | "confirm">("input");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const addFiles = useCallback((newFiles: File[]) => {
    setParseError("");
    setFiles((prev) => {
      const existingKeys = new Set(prev.map((e) => e.file.name + e.file.size));
      const entries: FileEntry[] = newFiles
        .filter((f) => !existingKeys.has(f.name + f.size))
        .slice(0, 5 - prev.length)
        .map((f) => ({
          id: Math.random().toString(36).slice(2),
          file: f,
          previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
        }));
      return [...prev, ...entries];
    });
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((e) => e.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleParseFiles = async () => {
    if (files.length === 0) return;
    setParsing(true);
    setParseError("");
    try {
      const formData = new FormData();
      const mimeToExt: Record<string, string> = {
        "image/jpeg": "jpg", "image/png": "png",
        "image/gif": "gif", "image/webp": "webp", "application/pdf": "pdf",
      };
      await Promise.all(
        files.map(async (entry, i) => {
          const ext = mimeToExt[entry.file.type] || "bin";
          const bytes = await entry.file.arrayBuffer();
          const blob = new Blob([bytes], { type: entry.file.type });
          formData.append("files", blob, `file_${i}.${ext}`);
        })
      );

      const res = await fetch("/api/parse-image", { method: "POST", body: formData });
      const parsed = await res.json();

      if (!res.ok) throw new Error(parsed.error || "読み取りに失敗しました");

      setForm((prev) => {
        const next = { ...prev };
        for (const field of PARSEABLE_FIELDS) {
          const val = parsed[field];
          if (val != null && val !== "") {
            (next as Record<string, string>)[field] = String(val);
          }
        }
        return next;
      });
      setStep("confirm");
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "読み取りに失敗しました");
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          departureLat: form.departureLat ? parseFloat(form.departureLat) : null,
          departureLng: form.departureLng ? parseFloat(form.departureLng) : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/reservations/${data.id}`);
      } else {
        alert("保存に失敗しました");
      }
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="pt-2 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => (step === "confirm" ? setStep("input") : router.back())}
          className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-800 text-lg">予約を追加</h1>
      </div>

      {/* Tab selector */}
      {step === "input" && (
        <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setTab("file")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "file" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
          >
            📷 写真・PDFから取込
          </button>
          <button
            onClick={() => setTab("manual")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "manual" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
          >
            ✏️ 手動入力
          </button>
        </div>
      )}

      {/* File upload tab */}
      {step === "input" && tab === "file" && (
        <div className="bg-white rounded-2xl p-4 space-y-4 border border-gray-100">
          <p className="text-sm text-gray-500">
            予約確認書の写真・スクリーンショット・PDFをアップロードすると、AIが自動で情報を読み取ります。
            <span className="font-medium text-blue-600"> 複数枚まとめて選択可能です。</span>
          </p>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${
              dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-300 hover:bg-gray-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(Array.from(e.target.files));
                e.target.value = "";
              }}
            />
            <div className="flex justify-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-700">タップしてファイルを選択</p>
            <p className="text-xs text-gray-400 mt-1">JPG・PNG・WebP・PDF対応 ／ 最大5枚</p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">{files.length}枚選択中</p>
              <div className="grid grid-cols-3 gap-2">
                {files.map((entry) => (
                  <div key={entry.id} className="relative">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                      {entry.previewUrl ? (
                        <Image
                          src={entry.previewUrl}
                          alt={entry.file.name}
                          width={120}
                          height={120}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 p-2">
                          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-xs text-gray-500 text-center break-all leading-tight">{entry.file.name.slice(0, 12)}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(entry.id); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add more button */}
                {files.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-blue-300 hover:text-blue-300 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {parseError && (
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-sm text-red-600">{parseError}</p>
            </div>
          )}

          <button
            onClick={handleParseFiles}
            disabled={files.length === 0 || parsing}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            {parsing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {files.length > 1 ? `${files.length}枚をAIが読み取り中...` : "AIが読み取り中..."}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {files.length > 1 ? `${files.length}枚をAIで読み取る` : "AIで情報を読み取る"}
              </>
            )}
          </button>
        </div>
      )}

      {/* Manual / Confirm form */}
      {(step === "confirm" || (step === "input" && tab === "manual")) && (
        <div className="bg-white rounded-2xl p-4 space-y-4 border border-gray-100">
          {step === "confirm" && (
            <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-700 font-medium">
                {files.length > 1 ? `${files.length}枚からAIが情報を読み取りました。` : "AIが情報を読み取りました。"}
                確認・修正してください。
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={labelClass}>バス会社 *</label>
              <input type="text" value={form.busCompany} onChange={(e) => updateForm("busCompany", e.target.value)} className={inputClass} placeholder="○○バス" />
            </div>
            <div>
              <label className={labelClass}>予約番号 *</label>
              <input type="text" value={form.bookingNumber} onChange={(e) => updateForm("bookingNumber", e.target.value)} className={inputClass} placeholder="ABC123" />
            </div>
            <div>
              <label className={labelClass}>氏名 *</label>
              <input type="text" value={form.passengerName} onChange={(e) => updateForm("passengerName", e.target.value)} className={inputClass} placeholder="山田 太郎" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>出発日 *</label>
                <input type="date" value={form.departureDate} onChange={(e) => updateForm("departureDate", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>出発時刻 *</label>
                <input type="time" value={form.departureTime} onChange={(e) => updateForm("departureTime", e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>到着時刻</label>
              <input type="time" value={form.arrivalTime} onChange={(e) => updateForm("arrivalTime", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>出発バス停 *</label>
              <input type="text" value={form.departureStop} onChange={(e) => updateForm("departureStop", e.target.value)} className={inputClass} placeholder="新宿西口バスターミナル" />
            </div>
            <div>
              <label className={labelClass}>到着バス停 *</label>
              <input type="text" value={form.arrivalStop} onChange={(e) => updateForm("arrivalStop", e.target.value)} className={inputClass} placeholder="大阪梅田" />
            </div>
            <div>
              <label className={labelClass}>座席番号</label>
              <input type="text" value={form.seatNumber} onChange={(e) => updateForm("seatNumber", e.target.value)} className={inputClass} placeholder="4A" />
            </div>
            <div>
              <label className={labelClass}>QRコードデータ（任意）</label>
              <input type="text" value={form.qrCodeData} onChange={(e) => updateForm("qrCodeData", e.target.value)} className={inputClass} placeholder="予約番号がある場合は自動生成されます" />
            </div>
            <div>
              <label className={labelClass}>搭乗券URL（任意）</label>
              <input type="url" value={form.boardingPassUrl} onChange={(e) => updateForm("boardingPassUrl", e.target.value)} className={inputClass} placeholder="https://..." />
            </div>

            <div className="bg-gray-50 rounded-xl p-3 space-y-3">
              <p className="text-xs font-medium text-gray-600">乗り場の位置情報（任意）</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>緯度</label>
                  <input type="number" step="any" value={form.departureLat} onChange={(e) => updateForm("departureLat", e.target.value)} className={inputClass} placeholder="35.6895" />
                </div>
                <div>
                  <label className={labelClass}>経度</label>
                  <input type="number" step="any" value={form.departureLng} onChange={(e) => updateForm("departureLng", e.target.value)} className={inputClass} placeholder="139.6917" />
                </div>
              </div>
              <p className="text-xs text-gray-400">※ Google マップでバス停を検索→シェア→座標コピーで取得できます</p>
            </div>

            <div>
              <label className={labelClass}>メモ</label>
              <textarea value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} className={`${inputClass} h-24 resize-none`} placeholder="持ち物・注意事項など" />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !form.busCompany || !form.bookingNumber || !form.passengerName || !form.departureDate || !form.departureTime || !form.departureStop || !form.arrivalStop}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-base disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {saving ? "保存中..." : "予約を保存する"}
          </button>
        </div>
      )}
    </div>
  );
}
