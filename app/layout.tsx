import type { Metadata } from "next";
import { Be_Vietnam_Pro, Roboto_Mono } from "next/font/google";
import { Toaster } from "sonner";
import AppChrome from "@/components/layout/AppChrome";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const fontSans = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const fontMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "ShopAHSO | Linh kiện công nghiệp chính xác",
  description: "Hệ thống phân phối linh kiện, vật tư công nghiệp chính xác, tin cậy và hiệu suất cao.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}>
      <body className="min-h-[100dvh] flex flex-col font-sans selection:bg-primary selection:text-white">
        <AuthProvider>
          <AppChrome>{children}</AppChrome>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
