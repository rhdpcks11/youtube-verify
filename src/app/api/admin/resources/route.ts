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

  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("[Resources GET]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// POST: 자료 등록
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  try {
    const { name, keyword, resource_link } = await req.json();

    if (!keyword || !resource_link) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
    }

    const sb = getServiceSupabase();
    const { error } = await sb.from("resources").upsert(
      { name: name || "", keyword, resource_link },
      { onConflict: "keyword" }
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Resources POST]", err);
    return NextResponse.json({ error: "서버 오류: " + (err instanceof Error ? err.message : "알 수 없음") }, { status: 500 });
  }
}

// PATCH: 자료 수정
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  try {
    const { id, name, keyword, resource_link } = await req.json();

    if (!id) return NextResponse.json({ error: "ID 누락" }, { status: 400 });

    const sb = getServiceSupabase();
    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    if (keyword) updateData.keyword = keyword;
    if (resource_link) updateData.resource_link = resource_link;

    const { error } = await sb.from("resources").update(updateData).eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Resources PATCH]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// DELETE: 자료 삭제
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    const sb = getServiceSupabase();
    const { error } = await sb.from("resources").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Resources DELETE]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
