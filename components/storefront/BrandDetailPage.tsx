"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listCatalogBrands, listCatalogVariants } from "@/lib/api/services/catalog-variants.service";
import type { Brand } from "@/lib/brand/types";
import type { CatalogVariant } from "@/lib/catalog/types";

export default function BrandDetailPage({ slug }: { slug: string }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedBrand = useMemo(() => brands.find((brand) => brand.slug === slug) ?? null, [brands, slug]);

  useEffect(() => {
    async function loadBrandAndVariants() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const brandsResponse = await listCatalogBrands();
        setBrands(brandsResponse);

        const matchedBrand = brandsResponse.find((brand) => brand.slug === slug);
        if (!matchedBrand) {
          setVariants([]);
          return;
        }

        const variantsResponse = await listCatalogVariants({
          brandId: matchedBrand.id,
          limit: 48,
        });
        setVariants(variantsResponse);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Không thể tải dữ liệu thương hiệu.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadBrandAndVariants();
  }, [slug]);

  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-4 py-10 lg:py-12">
        <div className="mb-6">
          <Link
            href="/thuong-hieu"
            className="inline-flex h-9 items-center border border-border px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
          >
            ← Quay lại danh sách thương hiệu
          </Link>
        </div>

        {isLoading ? (
          <div className="border border-border p-8 text-sm text-muted-foreground">Đang tải dữ liệu thương hiệu...</div>
        ) : errorMessage ? (
          <div className="border border-border p-8 text-sm text-destructive">{errorMessage}</div>
        ) : !selectedBrand ? (
          <div className="border border-border p-8 text-sm text-muted-foreground">Không tìm thấy thương hiệu.</div>
        ) : (
          <>
            <header className="mb-8 border border-border bg-muted/15 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Thương hiệu</p>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex h-16 w-40 items-center justify-center border border-border bg-background px-2">
                  {selectedBrand.logoUrl ? (
                    <div className="relative h-10 w-full">
                      <Image
                        alt={`Logo ${selectedBrand.name}`}
                        className="object-contain"
                        fill
                        sizes="160px"
                        src={selectedBrand.logoUrl}
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">Chưa có logo</span>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight lg:text-4xl">{selectedBrand.name}</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Tổng biến thể đang mở bán: {variants.length}</p>
                </div>
              </div>
            </header>

            {variants.length === 0 ? (
              <div className="border border-border p-8 text-sm text-muted-foreground">Thương hiệu này hiện chưa có biến thể đang mở bán.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {variants.map((variant) => (
                  <article key={variant.id} className="flex flex-col border border-border bg-background">
                    <div className="border-b border-border bg-muted/15">
                      <div className="relative aspect-[4/3] w-full">
                        {variant.effectiveImageUrls?.[0] ? (
                          <Image
                            alt={variant.name}
                            className="object-cover"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                            src={variant.effectiveImageUrls[0]}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Chưa có ảnh
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="border-b border-border bg-muted/20 px-4 py-3">
                      <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{variant.category.name}</p>
                      <h2 className="mt-2 line-clamp-2 min-h-12 text-base font-black tracking-tight">{variant.name}</h2>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 px-4 py-4">
                      <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>
                      <p className="text-xs text-muted-foreground">Tồn kho: {variant.stockQuantity}</p>
                      <p className="text-lg font-black text-primary">{variant.price.toLocaleString("vi-VN")} đ</p>
                    </div>
                    <div className="border-t border-border px-4 py-3">
                      <Link
                        href={`/san-pham/${variant.slug}`}
                        className="inline-flex h-9 w-full items-center justify-center border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
