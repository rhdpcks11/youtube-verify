import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "구독 인증 자료 발송",
  description: "유튜브 구독 인증 후 자료를 받아보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
