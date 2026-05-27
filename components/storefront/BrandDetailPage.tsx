"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CatalogVariantCard from "@/components/storefront/CatalogVariantCard";
import { listCatalogBrands, searchCatalogVariants } from "@/lib/api/services/catalog-variants.service";
import type { Brand } from "@/lib/brand/types";
import type { CatalogVariant } from "@/lib/catalog/types";
import { FALLBACK_LOGO_IMAGE } from "@/lib/image-fallbacks";

type BrandDisplay = Pick<Brand, "name" | "slug" | "logoUrl">;

export default function BrandDetailPage({ slug }: { slug: string }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedBrand = useMemo<BrandDisplay | null>(() => brands.find((brand) => brand.slug === slug) ?? null, [brands, slug]);

  useEffect(() => {
    let isCancelled = false;

    async function loadBrandAndVariants() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const brandsResponse = await listCatalogBrands();

        if (isCancelled) {
          return;
        }

        setBrands(brandsResponse);

        const matchedBrand = brandsResponse.find((brand) => brand.slug === slug);
        if (!matchedBrand) {
          setVariants([]);
          return;
        }

        const variantsResponse = await searchCatalogVariants({
          brandId: matchedBrand.id,
          limit: 48,
          page: 1,
          sort: "relevance",
        });

        if (!isCancelled) {
          setVariants(variantsResponse.items);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Không thể tải dữ liệu thương hiệu.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadBrandAndVariants();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-4 py-10 lg:py-12">
        <div className="mb-6">
          <Link
            href="/thuong-hieu"
            className="inline-flex h-9 cursor-pointer items-center border border-border px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
          >
            Quay lại danh sách thương hiệu
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
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-16 w-full items-center justify-center border border-border bg-background px-2 sm:w-40">
                  <div className="relative h-10 w-full">
                    <Image
                      alt={`Logo ${selectedBrand.name}`}
                      className="object-contain"
                      fill
                      sizes="160px"
                      src={selectedBrand.logoUrl ?? FALLBACK_LOGO_IMAGE}
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <h1 className="text-3xl font-black tracking-tight lg:text-4xl">{selectedBrand.name}</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Tổng biến thể đang mở bán: {variants.length}</p>
                </div>
              </div>
            </header>

            {variants.length === 0 ? (
              <div className="border border-border p-8 text-sm text-muted-foreground">
                Nhóm này hiện chưa có biến thể đang mở bán.
              </div>
            ) : (
              <div className="grid min-h-[24rem] content-start grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {variants.map((variant) => (
                  <CatalogVariantCard key={variant.id} variant={variant} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
