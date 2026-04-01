"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { startRegistration } from "@simplewebauthn/browser";

export default function SetupPasskeyPage() {
  const { data: session } = useSession();
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!session) router.push("/login");
    if (
      typeof window !== "undefined" &&
      window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable
    ) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(
        setSupported
      );
    }
  }, [session, router]);

  const setupPasskey = async () => {
    setLoading(true);
    setError("");
    try {
      // Get registration options from server
      const optionsRes = await fetch("/api/passkey/register");
      if (!optionsRes.ok) {
        throw new Error("オプションの取得に失敗しました");
      }
      const options = await optionsRes.json();

      // Use SimpleWebAuthn browser library (handles all encoding correctly)
      const registrationResponse = await startRegistration(options);

      // Verify with server
      const verifyRes = await fetch("/api/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationResponse),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "設定に失敗しました");
      }

      setSuccess(true);
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("認証がキャンセルされました");
      } else {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800">生体認証を設定</h2>
            <p className="text-sm text-gray-500 mt-1">
              Face ID / Touch ID で素早くログインできます
            </p>
          </div>

          {!supported && (
            <div className="bg-yellow-50 rounded-xl p-3 mb-4">
              <p className="text-sm text-yellow-700">
                このデバイスは生体認証に対応していません
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 rounded-xl p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 rounded-xl p-4">
                <svg className="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold text-green-700">設定が完了しました！</p>
                <p className="text-sm text-green-600 mt-1">次回から生体認証でログインできます</p>
              </div>
              <Link
                href="/dashboard"
                className="block w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-center hover:bg-blue-700 transition-colors"
              >
                ダッシュボードへ
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={setupPasskey}
                disabled={loading || !supported}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                {loading ? "設定中..." : "Face ID / Touch ID を設定する"}
              </button>
              <Link
                href="/dashboard"
                className="block w-full py-3 text-center text-gray-500 hover:text-gray-700 text-sm"
              >
                後で設定する
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
