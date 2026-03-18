import crypto from "crypto";

interface SendAlimtalkParams {
  phone: string;
  resourceLink: string;
}

export async function sendAlimtalk({ phone, resourceLink }: SendAlimtalkParams): Promise<boolean> {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const pfId = process.env.SOLAPI_PFID;
  const templateId = process.env.SOLAPI_TEMPLATE_ID;
  const sender = process.env.SOLAPI_SENDER;

  if (!apiKey || !apiSecret || !pfId || !templateId || !sender) {
    console.warn("[Solapi] 환경변수 미설정 - 알림톡 발송 건너뜀");
    return false;
  }

  const date = new Date().toISOString();
  const salt = crypto.randomUUID();
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");

  const authorization = `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;

  try {
    const res = await fetch("https://api.solapi.com/messages/v4/send-many/detail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify({
        messages: [
          {
            to: phone,
            from: sender,
            kakaoOptions: {
              pfId,
              templateId,
              variables: {
                "#{자료링크}": resourceLink,
              },
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Solapi] 발송 실패:", err);
      return false;
    }
    console.log("[Solapi] 알림톡 발송 성공:", phone);
    return true;
  } catch (err) {
    console.error("[Solapi] 네트워크 오류:", err);
    return false;
  }
}
