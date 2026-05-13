"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { listCatalogBrands } from "@/lib/api/services/catalog-variants.service";
import type { Brand } from "@/lib/brand/types";

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
          <p className="mt-2 text-sm text-muted-foreground">Duyệt theo thương hiệu để xem toàn bộ biến thể đang mở bán.</p>
        </header>

        {isLoading ? (
          <div className="border border-border p-8 text-sm text-muted-foreground">Đang tải thương hiệu...</div>
        ) : errorMessage ? (
          <div className="border border-border p-8 text-sm text-destructive">{errorMessage}</div>
        ) : brands.length === 0 ? (
          <div className="border border-border p-8 text-sm text-muted-foreground">Hiện chưa có thương hiệu nào.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {brands.map((brand) => (
              <article key={brand.id} className="flex flex-col border border-border bg-background">
                <div className="flex h-32 items-center justify-center border-b border-border bg-muted/15 px-4">
                  {brand.logoUrl ? (
                    <div className="relative h-14 w-full max-w-[180px]">
                      <Image alt={`Logo ${brand.name}`} className="object-contain" fill sizes="180px" src={brand.logoUrl} />
                    </div>
                  ) : (
                    <p className="text-center text-sm font-semibold text-muted-foreground">Chưa có logo</p>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 px-4 py-4">
                  <h2 className="truncate text-lg font-black tracking-tight">{brand.name}</h2>
                  <p className="truncate text-xs text-muted-foreground">slug: {brand.slug}</p>
                </div>
                <div className="border-t border-border px-4 py-3">
                  <Link
                    href={`/thuong-hieu/${brand.slug}`}
                    className="inline-flex h-9 w-full items-center justify-center border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                  >
                    Xem sản phẩm của thương hiệu
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
