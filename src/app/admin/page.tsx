"use client";

import { useState, useEffect, useCallback } from "react";

interface Resource {
  id: string;
  name: string;
  youtube_url: string;
  resource_link: string;
  created_at: string;
}

interface PhoneRecord {
  phone: string;
  youtube_url: string;
  created_at: string;
  status: string;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"resources" | "phones">("resources");

  // 자료 관리
  const [resources, setResources] = useState<Resource[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newYoutubeUrl, setNewYoutubeUrl] = useState("");
  const [newResourceLink, setNewResourceLink] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 수정 중인 자료
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editYoutubeUrl, setEditYoutubeUrl] = useState("");
  const [editResourceLink, setEditResourceLink] = useState("");

  // 전화번호 수집
  const [phones, setPhones] = useState<PhoneRecord[]>([]);
  const [phoneLoading, setPhoneLoading] = useState(false);

  const safeJson = async (res: Response) => {
    const text = await res.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return null; }
  };

  const fetchResources = useCallback(async () => {
    setResLoading(true);
    try {
      const res = await fetch("/api/admin/resources");
      if (res.ok) { const data = await safeJson(res); if (data) setResources(data); }
    } catch (e) { console.error("fetchResources:", e); }
    setResLoading(false);
  }, []);

  const fetchPhones = useCallback(async () => {
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/admin/submissions?tab=phones");
      if (res.ok) { const data = await safeJson(res); if (data) setPhones(data); }
    } catch (e) { console.error("fetchPhones:", e); }
    setPhoneLoading(false);
  }, []);

  useEffect(() => {
    if (authed) {
      fetchResources();
      fetchPhones();
    }
  }, [authed, fetchResources, fetchPhones]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) setAuthed(true);
    else setLoginError("비밀번호가 틀렸습니다.");
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYoutubeUrl.trim() || !newResourceLink.trim() || !newName.trim()) return;
    setMessage(null);
    try {
      const res = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), youtube_url: newYoutubeUrl.trim(), resource_link: newResourceLink.trim() }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        setMessage({ type: "error", text: data?.error || `저장 실패 (${res.status})` });
        return;
      }
      setMessage({ type: "success", text: "자료가 저장되었습니다." });
      setNewName("");
      setNewYoutubeUrl("");
      setNewResourceLink("");
      fetchResources();
    } catch (err) {
      setMessage({ type: "error", text: "네트워크 오류: " + (err instanceof Error ? err.message : "알 수 없음") });
    }
  };

  const startEdit = (res: Resource) => {
    setEditingId(res.id);
    setEditName(res.name || "");
    setEditYoutubeUrl(res.youtube_url);
    setEditResourceLink(res.resource_link);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch("/api/admin/resources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName.trim(), youtube_url: editYoutubeUrl.trim(), resource_link: editResourceLink.trim() }),
      });
      if (!res.ok) {
        const data = await safeJson(res);
        alert(data?.error || "수정 실패");
        return;
      }
      setEditingId(null);
      fetchResources();
    } catch {
      alert("네트워크 오류");
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
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">관리자 대시보드</h1>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTab("resources")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === "resources" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              자료관리
            </button>
            <button
              onClick={() => setTab("phones")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === "phones" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              전화번호 {phones.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">{phones.length}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {/* 자료관리 탭 */}
        {tab === "resources" && (
          <div>
            <form onSubmit={handleAddResource} className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">자료 등록</h3>
              <div className="space-y-3">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="자료 이름 (예: 수학 기출문제)"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
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
                </div>
                <button
                  type="submit"
                  disabled={!newName.trim() || !newYoutubeUrl.trim() || !newResourceLink.trim()}
                  className="w-full py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  등록
                </button>
              </div>
              {message && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {message.text}
                </div>
              )}
            </form>

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
              <div className="space-y-3">
                {resources.map((res) => (
                  <div key={res.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    {editingId === res.id ? (
                      <div className="space-y-3">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="자료 이름"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <input
                          value={editYoutubeUrl}
                          onChange={(e) => setEditYoutubeUrl(e.target.value)}
                          placeholder="유튜브 URL"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <input
                          value={editResourceLink}
                          onChange={(e) => setEditResourceLink(e.target.value)}
                          placeholder="자료 링크"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={cancelEdit} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition">
                            취소
                          </button>
                          <button
                            onClick={() => handleSaveEdit(res.id)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800">{res.name || "(이름 없음)"}</p>
                            <p className="text-xs text-gray-400 mt-1 truncate">{res.youtube_url}</p>
                            <a href={res.resource_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-0.5 block truncate">
                              {res.resource_link}
                            </a>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => startEdit(res)}
                              className="px-3 py-1.5 text-xs text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteResource(res.id)}
                              className="px-3 py-1.5 text-xs text-red-400 border border-red-200 rounded-lg hover:bg-red-50 transition"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
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
                    const csv = "전화번호,유튜브URL,신청일시\n" +
                      phones.map(p => `${p.phone},${p.youtube_url},${new Date(p.created_at).toLocaleString("ko-KR")}`).join("\n");
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
                    </tr>
                  </thead>
                  <tbody>
                    {phones.map((p, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-3 text-sm text-gray-400">{i + 1}</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-700">
                          {p.phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500 max-w-[250px] truncate">{p.youtube_url}</td>
                        <td className="px-5 py-3 text-sm text-gray-400">{new Date(p.created_at).toLocaleDateString("ko-KR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
