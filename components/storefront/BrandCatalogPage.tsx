"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { listCatalogBrands } from "@/lib/api/services/catalog-variants.service";
import type { Brand } from "@/lib/brand/types";
import { FALLBACK_LOGO_IMAGE } from "@/lib/image-fallbacks";

export default function BrandCatalogPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadBrands() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await listCatalogBrands();
        setBrands(response);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Không thể tải danh sách thương hiệu.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadBrands();
  }, []);

  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-4 py-10 lg:py-12">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Thương hiệu</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight lg:text-4xl">Thương hiệu công nghiệp</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Duyệt theo thương hiệu để xem toàn bộ biến thể đang mở bán.
          </p>
        </header>

        {isLoading ? (
          <div className="border border-border p-8 text-sm text-muted-foreground">Đang tải thương hiệu...</div>
        ) : errorMessage ? (
          <div className="border border-border p-8 text-sm text-destructive">{errorMessage}</div>
        ) : brands.length === 0 ? (
          <div className="border border-border p-8 text-sm text-muted-foreground">Hiện chưa có thương hiệu nào.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                aria-label={`Xem sản phẩm thương hiệu ${brand.name}`}
                className="group flex min-h-56 cursor-pointer flex-col border border-border bg-background transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)] focus-visible:border-primary focus-visible:outline-none"
                href={`/thuong-hieu/${brand.slug}`}
              >
                <div className="flex h-32 items-center justify-center border-b border-border bg-muted/10 px-5 transition-colors group-hover:bg-muted/20">
                  <div className="relative h-16 w-full max-w-[190px]">
                    <Image
                      alt={`Logo ${brand.name}`}
                      className="object-contain"
                      fill
                      sizes="190px"
                      src={brand.logoUrl ?? FALLBACK_LOGO_IMAGE}
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Thương hiệu</p>
                  <h2 className="mt-2 line-clamp-2 text-lg font-black leading-tight tracking-tight transition-colors group-hover:text-primary">
                    {brand.name}
                  </h2>
                  <p className="mt-2 truncate font-mono text-xs text-muted-foreground">{brand.slug}</p>
                </div>
                <div className="flex h-11 items-center justify-between border-t border-border px-4 text-sm font-semibold transition-colors group-hover:border-primary group-hover:text-primary">
                  <span>Xem sản phẩm</span>
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
