"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInternalRoute = pathname.startsWith("/admin") || pathname.startsWith("/nhan-vien");

  if (isInternalRoute) {
    return <main className="flex min-h-[100dvh] flex-1 flex-col">{children}</main>;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar />
      <main className="flex min-h-[100dvh] flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
