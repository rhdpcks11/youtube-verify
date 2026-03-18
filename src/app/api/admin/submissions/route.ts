import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { sendAlimtalk } from "@/lib/solapi";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === "true";
}

// GET: pending 목록 조회
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from("submissions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

  const { data: submission, error: fetchErr } = await sb
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !submission) {
    return NextResponse.json({ error: "신청을 찾을 수 없습니다." }, { status: 404 });
  }

  const { error: updateErr } = await sb
    .from("submissions")
    .update({ status: action })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // 승인 시 알림톡 발송
  if (action === "approved") {
    const { data: resource } = await sb
      .from("resources")
      .select("resource_link")
      .eq("youtube_url", submission.youtube_url)
      .single();

    if (resource?.resource_link) {
      await sendAlimtalk({
        phone: submission.phone,
        resourceLink: resource.resource_link,
      });
    }
  }

  return NextResponse.json({ success: true });
}
