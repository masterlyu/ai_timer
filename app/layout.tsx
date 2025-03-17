import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "@/app/fonts";
import "./globals.css";
import { UserProvider } from "@/lib/context/UserContext";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/lib/context/AuthProvider";

export const metadata: Metadata = {
  title: "AI 기반 스마트 공부 타이머",
  description: "사용 패턴 학습 기반 맞춤형 집중 타이머",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <AuthProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
