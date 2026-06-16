"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroSearchConsole from "@/components/home/HeroSearchConsole";

const QUICK_LINKS = [
  { label: "Xem tất cả sản phẩm", href: "/san-pham" },
  { label: "Tra theo thương hiệu", href: "/thuong-hieu" },
  { label: "Gửi yêu cầu báo giá", href: "/tai-khoan/yeu-cau-bao-gia", highlight: true },
];

const Hero = () => {
  return (
    <section className="border-b border-border bg-background">
      <div className="absolute left-0 h-0.5 w-full bg-primary" />
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
          {/* Search — chiếm phần lớn không gian */}
          <div className="min-w-0 flex-1">
            <HeroSearchConsole />
          </div>

          {/* Quick CTAs */}
          <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:pt-[52px]">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  link.highlight
                    ? "inline-flex h-10 cursor-pointer items-center gap-2 border border-primary bg-primary px-4 text-sm font-black text-primary-foreground transition-colors hover:bg-primary/90"
                    : "inline-flex h-10 cursor-pointer items-center gap-2 border border-border bg-background px-4 text-sm font-black transition-colors hover:border-primary hover:text-primary"
                }
              >
                {link.label}
                <ArrowRight className="size-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
