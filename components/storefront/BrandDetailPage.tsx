"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BrandDetailHeader from "@/components/storefront/BrandDetailHeader";
import CatalogVariantCard from "@/components/storefront/CatalogVariantCard";
import { listCatalogBrands, searchCatalogVariants } from "@/lib/api/services/catalog-variants.service";
import type { Brand } from "@/lib/brand/types";
import type { CatalogVariant } from "@/lib/catalog/types";

type BrandDisplay = Pick<Brand, "name" | "slug" | "logoUrl" | "bannerUrl">;

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
            <BrandDetailHeader brand={selectedBrand} variantCount={variants.length} />

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
