"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { startAuthentication } from "@simplewebauthn/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.PublicKeyCredential &&
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
    ) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(
        (available) => setBiometricAvailable(available)
      );
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    setError("");
    try {
      // Get authentication options from server
      const optionsRes = await fetch("/api/passkey/authenticate");
      const options = await optionsRes.json();

      if (!options.challengeId) {
        setError("生体認証の準備に失敗しました");
        setLoading(false);
        return;
      }

      const { challengeId, ...authOptions } = options;

      // Use SimpleWebAuthn browser library (handles all encoding correctly)
      let authResponse;
      try {
        authResponse = await startAuthentication(authOptions);
      } catch (err) {
        if (err instanceof Error && err.name === "NotAllowedError") {
          setError("生体認証がキャンセルされました");
        } else {
          setError("生体認証が設定されていません。パスワードでログインしてください。");
        }
        setLoading(false);
        return;
      }

      // Verify with server
      const verifyRes = await fetch("/api/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...authResponse, challengeId }),
      });

      if (!verifyRes.ok) {
        setError("生体認証に失敗しました。パスワードでログインしてください。");
        setLoading(false);
        return;
      }

      const { token, email: userEmail } = await verifyRes.json();

      if (!token || !userEmail) {
        setError("認証エラーが発生しました");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: userEmail,
        password: `__passkey_token__${token}`,
        redirect: false,
      });

      if (result?.error) {
        setError("ログインに失敗しました");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("生体認証に失敗しました。パスワードでログインしてください。");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">BusPass</h1>
          <p className="text-blue-200 text-sm mt-1">高速バス予約管理</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5">ログイン</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          {biometricAvailable && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">または</span>
                </div>
              </div>
              <button
                onClick={handleBiometricLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-blue-400 text-gray-700 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
                Face ID / Touch ID でログイン
              </button>
            </>
          )}

          <p className="mt-5 text-center text-sm text-gray-500">
            アカウントをお持ちでない方は{" "}
            <Link href="/register" className="text-blue-600 font-medium hover:underline">
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
