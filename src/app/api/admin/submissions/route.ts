import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === "true";
}

// GET: pending 목록 조회
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const sb = getServiceSupabase();
  const url = new URL(req.url);
  const tab = url.searchParams.get("tab");

  if (tab === "phones") {
    // 승인된 전화번호 목록
    const { data, error } = await sb
      .from("submissions")
      .select("phone, youtube_url, created_at, status")
      .in("status", ["auto_approved", "approved"])
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await sb
    .from("submissions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH: 승인 또는 거절
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const { id, action } = await req.json();

  if (!id || !["approved", "rejected"].includes(action)) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const sb = getServiceSupabase();

  const { error: updateErr } = await sb
    .from("submissions")
    .update({ status: action })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
