import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { youtubeUrl, phone, imageUrl } = await req.json();

    if (!youtubeUrl || !phone || !imageUrl) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    const sb = getServiceSupabase();

    // 등록된 자료 조회
    const { data: resource } = await sb
      .from("resources")
      .select("resource_link")
      .eq("youtube_url", youtubeUrl)
      .single();

    if (!resource?.resource_link) {
      return NextResponse.json({ error: "등록되지 않은 영상입니다. URL을 다시 확인해주세요." }, { status: 404 });
    }

    // DB에 신청 저장 (자동승인)
    const { error: insertErr } = await sb.from("submissions").insert({
      phone,
      youtube_url: youtubeUrl,
      image_url: imageUrl,
      status: "auto_approved",
      ai_result: "URL 매칭 자동승인",
    });

    if (insertErr) {
      console.error("[DB] 저장 오류:", insertErr);
      return NextResponse.json({ error: "신청 저장에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      status: "auto_approved",
      resourceLink: resource.resource_link,
    });
  } catch (err) {
    console.error("[Verify] 오류:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
