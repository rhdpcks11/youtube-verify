import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const sb = getServiceSupabase();
    const { error: uploadErr } = await sb.storage
      .from("screenshots")
      .upload(fileName, buffer, { contentType: file.type });

    if (uploadErr) {
      console.error("[Upload]", uploadErr);
      return NextResponse.json({ error: "업로드 실패: " + uploadErr.message }, { status: 500 });
    }

    const { data: urlData } = sb.storage
      .from("screenshots")
      .getPublicUrl(fileName);

    return NextResponse.json({ imageUrl: urlData.publicUrl });
  } catch (err) {
    console.error("[Upload]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
