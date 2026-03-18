import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === "true";
}

// GET: 자료 목록 조회
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: 자료 등록
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const { youtube_url, resource_link } = await req.json();

  if (!youtube_url || !resource_link) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const sb = getServiceSupabase();
  const { error } = await sb.from("resources").upsert(
    { youtube_url, resource_link },
    { onConflict: "youtube_url" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE: 자료 삭제
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const { id } = await req.json();
  const sb = getServiceSupabase();
  const { error } = await sb.from("resources").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
