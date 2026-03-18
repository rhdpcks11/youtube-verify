import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === "true";
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  try {
    const sb = getServiceSupabase();
    const url = new URL(req.url);
    const tab = url.searchParams.get("tab");

    if (tab === "phones") {
      const { data, error } = await sb
        .from("submissions")
        .select("phone, youtube_url, created_at, status")
        .in("status", ["auto_approved", "approved"])
        .order("created_at", { ascending: false });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data || []);
    }

    // default: pending
    const { data, error } = await sb
      .from("submissions")
      .select("id, phone, youtube_url, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("[Submissions GET]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
