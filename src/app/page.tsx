"use client";

import { useState } from "react";

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    resourceLink?: string;
  } | null>(null);

  const formatPhone = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim() || !phone.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl: youtubeUrl.trim(),
          phone: phone.replace(/-/g, ""),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "처리 중 오류가 발생했습니다.");

      setResult({
        success: true,
        message: "구독 인증이 완료되었습니다! 아래 링크에서 자료를 받아주세요.",
        resourceLink: data.resourceLink,
      });

      setYoutubeUrl("");
      setPhone("");
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "알 수 없는 오류",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">구독 인증 자료 받기</h1>
          <p className="text-gray-500 mt-2 text-sm">유튜브 구독 인증 후<br />바로 자료 링크를 받을 수 있어요</p>
        </div>

        {result?.resourceLink ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
              <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">인증 완료!</h2>
            <p className="text-sm text-gray-500 mb-5">아래 버튼을 눌러 자료를 받아주세요.</p>
            <a
              href={result.resourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all active:scale-[0.98] text-center"
            >
              자료 받으러 가기
            </a>
            <button
              onClick={() => setResult(null)}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition"
            >
              처음으로 돌아가기
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">유튜브 영상 URL</label>
                <input
                  type="url"
                  required
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">전화번호</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !youtubeUrl.trim() || !phone.trim()}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    확인 중...
                  </span>
                ) : (
                  "자료 받기"
                )}
              </button>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                자료 수령 시 마케팅 정보 수신에 동의하는 것으로 간주됩니다.
              </p>

              {result && !result.success && (
                <div className="p-4 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200">
                  {result.message}
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
