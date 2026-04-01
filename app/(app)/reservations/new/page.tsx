"use client";

import { useState, useRef } from "react";
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

const INITIAL_FORM: FormData = {
  busCompany: "",
  bookingNumber: "",
  passengerName: "",
  departureDate: "",
  departureTime: "",
  arrivalTime: "",
  departureStop: "",
  arrivalStop: "",
  seatNumber: "",
  qrCodeData: "",
  boardingPassUrl: "",
  departureLat: "",
  departureLng: "",
  notes: "",
  rawEmailContent: "",
};

export default function NewReservationPage() {
  const [tab, setTab] = useState<Tab>("file");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = (selected: File) => {
    setFile(selected);
    setParseError("");
    if (selected.type.startsWith("image/")) {
      const url = URL.createObjectURL(selected);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleParseFile = async () => {
    if (!file) return;
    setParsing(true);
    setParseError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "読み取りに失敗しました");
      }

      const parsed = await res.json();
      setForm((prev) => ({
        ...prev,
        busCompany: parsed.busCompany || prev.busCompany,
        bookingNumber: parsed.bookingNumber || prev.bookingNumber,
        passengerName: parsed.passengerName || prev.passengerName,
        departureDate: parsed.departureDate || prev.departureDate,
        departureTime: parsed.departureTime || prev.departureTime,
        arrivalTime: parsed.arrivalTime || prev.arrivalTime,
        departureStop: parsed.departureStop || prev.departureStop,
        arrivalStop: parsed.arrivalStop || prev.arrivalStop,
        seatNumber: parsed.seatNumber || prev.seatNumber,
      }));
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

  const inputClass =
    "w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base";
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
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "file" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
            }`}
          >
            📷 写真・PDFから取込
          </button>
          <button
            onClick={() => setTab("manual")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "manual" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
            }`}
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
          </p>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-blue-400 bg-blue-50"
                : file
                ? "border-green-400 bg-green-50"
                : "border-gray-300 hover:border-blue-300 hover:bg-gray-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {file ? (
              <div className="space-y-2">
                {preview ? (
                  <div className="relative w-full max-h-48 overflow-hidden rounded-xl">
                    <Image
                      src={preview}
                      alt="preview"
                      width={400}
                      height={192}
                      className="w-full object-contain max-h-48"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
                <p className="text-sm font-medium text-gray-700">{file.name}</p>
                <p className="text-xs text-gray-400">タップして変更</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">タップして選択</p>
                  <p className="text-xs text-gray-400 mt-1">JPG・PNG・WebP・PDF対応</p>
                </div>
              </div>
            )}
          </div>

          {parseError && (
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-sm text-red-600">{parseError}</p>
            </div>
          )}

          <button
            onClick={handleParseFile}
            disabled={!file || parsing}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            {parsing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                AIが読み取り中...
              </>
            ) : (
              "AIで情報を読み取る"
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
              <p className="text-sm text-green-700 font-medium">AIが情報を読み取りました。確認・修正してください。</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={labelClass}>バス会社 *</label>
              <input type="text" value={form.busCompany} onChange={(e) => updateForm("busCompany", e.target.value)} className={inputClass} placeholder="○○バス" required />
            </div>
            <div>
              <label className={labelClass}>予約番号 *</label>
              <input type="text" value={form.bookingNumber} onChange={(e) => updateForm("bookingNumber", e.target.value)} className={inputClass} placeholder="ABC123" required />
            </div>
            <div>
              <label className={labelClass}>氏名 *</label>
              <input type="text" value={form.passengerName} onChange={(e) => updateForm("passengerName", e.target.value)} className={inputClass} placeholder="山田 太郎" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>出発日 *</label>
                <input type="date" value={form.departureDate} onChange={(e) => updateForm("departureDate", e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>出発時刻 *</label>
                <input type="time" value={form.departureTime} onChange={(e) => updateForm("departureTime", e.target.value)} className={inputClass} required />
              </div>
            </div>

            <div>
              <label className={labelClass}>到着時刻</label>
              <input type="time" value={form.arrivalTime} onChange={(e) => updateForm("arrivalTime", e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>出発バス停 *</label>
              <input type="text" value={form.departureStop} onChange={(e) => updateForm("departureStop", e.target.value)} className={inputClass} placeholder="新宿西口バスターミナル" required />
            </div>
            <div>
              <label className={labelClass}>到着バス停 *</label>
              <input type="text" value={form.arrivalStop} onChange={(e) => updateForm("arrivalStop", e.target.value)} className={inputClass} placeholder="大阪梅田" required />
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

            {/* Location */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-3">
              <p className="text-xs font-medium text-gray-600">乗り場の位置情報（任意・より正確なマップ表示に）</p>
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
