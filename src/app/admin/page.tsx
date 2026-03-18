"use client";

import { useState, useEffect, useCallback } from "react";

interface Submission {
  id: string;
  phone: string;
  youtube_url: string;
  image_url: string;
  status: string;
  ai_result: string;
  created_at: string;
}

interface Resource {
  id: string;
  youtube_url: string;
  resource_link: string;
  created_at: string;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"submissions" | "resources" | "phones">("submissions");

  // 신청 목록
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  // 자료 관리
  const [resources, setResources] = useState<Resource[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [newYoutubeUrl, setNewYoutubeUrl] = useState("");
  const [newResourceLink, setNewResourceLink] = useState("");

  // 전화번호 수집
  const [phones, setPhones] = useState<{ phone: string; youtube_url: string; created_at: string; status: string }[]>([]);
  const [phoneLoading, setPhoneLoading] = useState(false);

  // 메시지
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 이미지 모달
  const [modalImage, setModalImage] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setSubLoading(true);
    const res = await fetch("/api/admin/submissions");
    if (res.ok) setSubmissions(await res.json());
    setSubLoading(false);
  }, []);

  const fetchResources = useCallback(async () => {
    setResLoading(true);
    const res = await fetch("/api/admin/resources");
    if (res.ok) setResources(await res.json());
    setResLoading(false);
  }, []);

  const fetchPhones = useCallback(async () => {
    setPhoneLoading(true);
    const res = await fetch("/api/admin/submissions?tab=phones");
    if (res.ok) setPhones(await res.json());
    setPhoneLoading(false);
  }, []);

  useEffect(() => {
    if (authed) {
      fetchSubmissions();
      fetchResources();
      fetchPhones();
    }
  }, [authed, fetchSubmissions, fetchResources, fetchPhones]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
    } else {
      setLoginError("비밀번호가 틀렸습니다.");
    }
  };

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    await fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    fetchSubmissions();
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYoutubeUrl.trim() || !newResourceLink.trim()) return;
    setMessage(null);
    try {
      const res = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: newYoutubeUrl.trim(), resource_link: newResourceLink.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "저장 실패" });
        return;
      }
      setMessage({ type: "success", text: "자료가 저장되었습니다." });
      setNewYoutubeUrl("");
      setNewResourceLink("");
      fetchResources();
    } catch (err) {
      setMessage({ type: "error", text: "네트워크 오류: " + (err instanceof Error ? err.message : "알 수 없음") });
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await fetch("/api/admin/resources", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchResources();
  };

  const parseAiResult = (result: string) => {
    try {
      const match = result.match(/\{[\s\S]*?\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          subscribed: parsed.subscribed,
          reason: parsed.reason || "근거 없음",
        };
      }
    } catch {}
    return { subscribed: false, reason: result || "분석 실패" };
  };

  // 로그인 화면
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-xl font-bold text-center mb-6">관리자 로그인</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 mb-4"
          />
          {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
          <button type="submit" className="w-full py-3 rounded-xl text-white font-bold text-sm bg-blue-500 hover:bg-blue-600 transition">
            로그인
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">관리자 대시보드</h1>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTab("submissions")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === "submissions" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              신청목록 {submissions.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">{submissions.length}</span>}
            </button>
            <button
              onClick={() => setTab("resources")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === "resources" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              자료관리
            </button>
            <button
              onClick={() => setTab("phones")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === "phones" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              전화번호 {phones.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">{phones.length}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {/* 신청목록 탭 */}
        {tab === "submissions" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-600">대기 중인 신청 ({submissions.length}건)</h2>
              <button onClick={fetchSubmissions} disabled={subLoading} className="text-sm text-blue-500 hover:text-blue-700">
                {subLoading ? "로딩..." : "새로고침"}
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                대기 중인 신청이 없습니다
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => {
                  const ai = parseAiResult(sub.ai_result);
                  return (
                    <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex gap-5">
                        {/* 인증샷 썸네일 */}
                        <div
                          className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                          onClick={() => setModalImage(sub.image_url)}
                        >
                          <img src={sub.image_url} alt="인증샷" className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold">{sub.phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")}</p>
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{sub.youtube_url}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                AI 판단:{" "}
                                <span className={ai.subscribed ? "text-green-600" : "text-red-500"}>
                                  {ai.subscribed ? "구독 감지됨" : "구독 미감지"}
                                </span>
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{ai.reason}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleAction(sub.id, "approved")}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition"
                              >
                                승인
                              </button>
                              <button
                                onClick={() => handleAction(sub.id, "rejected")}
                                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                              >
                                거절
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-300 mt-2">{new Date(sub.created_at).toLocaleString("ko-KR")}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 자료관리 탭 */}
        {tab === "resources" && (
          <div>
            {/* 자료 등록 폼 */}
            <form onSubmit={handleAddResource} className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">자료 등록/수정</h3>
              <div className="flex gap-3">
                <input
                  value={newYoutubeUrl}
                  onChange={(e) => setNewYoutubeUrl(e.target.value)}
                  placeholder="유튜브 URL"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  value={newResourceLink}
                  onChange={(e) => setNewResourceLink(e.target.value)}
                  placeholder="자료 링크"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition flex-shrink-0"
                >
                  저장
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">같은 유튜브 URL이 있으면 자료 링크가 업데이트됩니다.</p>
              {message && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {message.text}
                </div>
              )}
            </form>

            {/* 자료 목록 */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-600">등록된 자료 ({resources.length}건)</h2>
              <button onClick={fetchResources} disabled={resLoading} className="text-sm text-blue-500 hover:text-blue-700">
                {resLoading ? "로딩..." : "새로고침"}
              </button>
            </div>

            {resources.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                등록된 자료가 없습니다
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">유튜브 URL</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">자료 링크</th>
                      <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((res) => (
                      <tr key={res.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-3 text-sm text-gray-700 max-w-[250px] truncate">{res.youtube_url}</td>
                        <td className="px-5 py-3 text-sm text-blue-500 max-w-[250px] truncate">
                          <a href={res.resource_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {res.resource_link}
                          </a>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDeleteResource(res.id)}
                            className="text-xs text-red-400 hover:text-red-600 transition"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 전화번호 탭 */}
        {tab === "phones" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-600">수집된 전화번호 ({phones.length}건)</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const csv = "전화번호,유튜브URL,신청일시,상태\n" +
                      phones.map(p => `${p.phone},${p.youtube_url},${new Date(p.created_at).toLocaleString("ko-KR")},${p.status}`).join("\n");
                    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `전화번호_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                  }}
                  disabled={phones.length === 0}
                  className="text-sm text-green-600 hover:text-green-800 font-medium disabled:opacity-40"
                >
                  CSV 다운로드
                </button>
                <button onClick={fetchPhones} disabled={phoneLoading} className="text-sm text-blue-500 hover:text-blue-700">
                  {phoneLoading ? "로딩..." : "새로고침"}
                </button>
              </div>
            </div>

            {phones.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                수집된 전화번호가 없습니다
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">#</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">전화번호</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">유튜브 URL</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">신청일</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phones.map((p, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-3 text-sm text-gray-400">{i + 1}</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-700">
                          {p.phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500 max-w-[200px] truncate">{p.youtube_url}</td>
                        <td className="px-5 py-3 text-sm text-gray-400">{new Date(p.created_at).toLocaleDateString("ko-KR")}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            p.status === "auto_approved" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {p.status === "auto_approved" ? "자동승인" : "수동승인"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 이미지 모달 */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="max-w-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <img src={modalImage} alt="인증샷" className="rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
