import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { TripProvider } from "@/contexts/TripContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthDevBar from "@/components/auth/AuthDevBar";
import AuthGate from "@/components/auth/AuthGate";
import { PWA_CONFIG } from "@/lib/pwa-config";
import RegisterServiceWorker from "@/components/pwa/RegisterServiceWorker";
import { PwaInstallProvider } from "@/contexts/PwaInstallContext";
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
  title: PWA_CONFIG.name,
  description: PWA_CONFIG.description,
  applicationName: PWA_CONFIG.short_name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PWA_CONFIG.short_name,
  },
  formatDetection: {
    telephone: false,
  },
};

/** 모바일·PWA 뷰포트 설정 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: PWA_CONFIG.theme_color,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} h-full antialiased light`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <PwaInstallProvider>
            <AuthGate>
              <TripProvider>{children}</TripProvider>
              <AuthDevBar />
            </AuthGate>
            <RegisterServiceWorker />
          </PwaInstallProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
