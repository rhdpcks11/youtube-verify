import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServiceSupabase } from "@/lib/supabase";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { youtubeUrl, phone, imageUrl } = await req.json();

    if (!youtubeUrl || !phone || !imageUrl) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    const sb = getServiceSupabase();

    // Claude Vision으로 "구독중" 텍스트 인식
    let aiResult = "";
    let isSubscribed = false;

    try {
      const response = await anthropic.messages.create({
        model: "claude-opus-4-5-20250514",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "url", url: imageUrl },
              },
              {
                type: "text",
                text: '이 이미지는 유튜브 구독 인증 스크린샷입니다. 이미지에 "구독중" 텍스트가 보이는지 확인해주세요. 반드시 다음 JSON 형식으로만 답변하세요: {"subscribed": true/false, "reason": "판단 근거"}',
              },
            ],
          },
        ],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      aiResult = text;

      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        isSubscribed = parsed.subscribed === true;
      }
    } catch (aiErr) {
      console.error("[AI] 분석 오류:", aiErr);
      aiResult = "AI 분석 실패";
    }

    const status = isSubscribed ? "auto_approved" : "pending";

    // DB에 신청 저장
    const { error: insertErr } = await sb.from("submissions").insert({
      phone,
      youtube_url: youtubeUrl,
      image_url: imageUrl,
      status,
      ai_result: aiResult,
    });

    if (insertErr) {
      console.error("[DB] 저장 오류:", insertErr);
      return NextResponse.json({ error: "신청 저장에 실패했습니다." }, { status: 500 });
    }

    // 자동승인 시 자료 링크 반환
    let resourceLink = "";
    if (isSubscribed) {
      const { data: resource } = await sb
        .from("resources")
        .select("resource_link")
        .eq("youtube_url", youtubeUrl)
        .single();

      resourceLink = resource?.resource_link || "";
    }

    return NextResponse.json({ status, aiResult, resourceLink });
  } catch (err) {
    console.error("[Verify] 오류:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
