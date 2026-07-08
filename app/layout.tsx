import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { TripProvider } from "@/contexts/TripContext";
import "./globals.css";

/**
 * 한글을 깔끔하게 보여주는 폰트
 * Apple SD Gothic Neo와 비슷한 느낌의 산세리프체입니다.
 */
const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** 브라우저 탭에 표시되는 앱 정보 */
export const metadata: Metadata = {
  title: "TripFlow J — 여행 계획",
  description: "계획적인 여행을 위한 여행 계획 앱, TripFlow J",
};

/** 모바일 앱처럼 보이도록 뷰포트 설정 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col text-foreground">
        <TripProvider>{children}</TripProvider>
      </body>
    </html>
  );
}
