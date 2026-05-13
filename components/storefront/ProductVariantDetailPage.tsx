"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCatalogVariantBySlug } from "@/lib/api/services/catalog-variants.service";
import type { CatalogVariant, CatalogVariantAttributeValue } from "@/lib/catalog/types";

type DisplaySpec = {
  key: string;
  label: string;
  value: string;
  unit: string;
};

function prettifyCode(code: string) {
  return code
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toDisplayValueFromAttributeValue(item: CatalogVariantAttributeValue) {
  if (item.valueText != null && item.valueText !== "") {
    return item.valueText;
  }
  if (item.valueNumber != null) {
    return String(item.valueNumber);
  }
  if (item.valueBoolean != null) {
    return item.valueBoolean ? "Có" : "Không";
  }
  if (item.valueEnum != null && item.valueEnum !== "") {
    return item.valueEnum;
  }
  return "";
}

export default function ProductVariantDetailPage({ slug }: { slug: string }) {
  const [variant, setVariant] = useState<CatalogVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const technicalSpecs = useMemo<DisplaySpec[]>(() => {
    if (!variant) {
      return [];
    }

    if (Array.isArray(variant.attributeValues) && variant.attributeValues.length > 0) {
      return variant.attributeValues
        .map((item) => {
          const raw = item as CatalogVariantAttributeValue & {
            definition?: { name?: string; unit?: string | null; code?: string };
            productAttributeDefinition?: { name?: string; unit?: string | null; code?: string };
            attribute?: { name?: string; unit?: string | null; code?: string };
            unit?: string | null;
          };
          const value = toDisplayValueFromAttributeValue(item);
          if (!value) {
            return null;
          }

          const fallbackCode =
            item.code
            || raw.definition?.code
            || raw.productAttributeDefinition?.code
            || raw.attribute?.code
            || "attribute";

          const label =
            item.definition?.name?.trim()
            || raw.productAttributeDefinition?.name?.trim()
            || raw.attribute?.name?.trim()
            || prettifyCode(fallbackCode);

          const unit =
            item.definition?.unit
            || raw.productAttributeDefinition?.unit
            || raw.attribute?.unit
            || raw.unit
            || "";

          return {
            key: item.id ?? fallbackCode,
            label,
            value,
            unit,
          };
        })
        .filter((item): item is DisplaySpec => item !== null);
    }

    if (variant.specSnapshot && typeof variant.specSnapshot === "object") {
      return Object.entries(variant.specSnapshot)
        .map(([key, rawValue]) => {
          if (rawValue == null || rawValue === "") {
            return null;
          }

          const value =
            typeof rawValue === "string"
              ? rawValue
              : typeof rawValue === "number"
                ? String(rawValue)
                : typeof rawValue === "boolean"
                  ? rawValue
                    ? "Có"
                    : "Không"
                  : JSON.stringify(rawValue);

          return {
            key,
            label: key,
            value,
            unit: "",
          };
        })
        .filter((item): item is DisplaySpec => item !== null);
    }

    return [];
  }, [variant]);

  useEffect(() => {
    async function loadVariant() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await getCatalogVariantBySlug(slug);
        setVariant(response);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Không thể tải chi tiết sản phẩm.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadVariant();
  }, [slug]);

  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-4 py-10 lg:py-12">
        <div className="mb-6">
          <Link
            className="inline-flex h-9 items-center border border-border px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
            href="/san-pham"
          >
            ← Quay lại danh sách sản phẩm
          </Link>
        </div>

        {isLoading ? (
          <div className="border border-border p-8 text-sm text-muted-foreground">Đang tải chi tiết sản phẩm...</div>
        ) : errorMessage || !variant ? (
          <div className="border border-border p-8 text-sm text-destructive">
            {errorMessage ?? "Không tìm thấy sản phẩm."}
          </div>
        ) : (
          <article className="grid gap-8 border border-border bg-background p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="mb-5 border border-border bg-muted/15">
                <div className="relative aspect-[16/9] w-full">
                  {variant.effectiveImageUrls?.[0] ? (
                    <Image
                      alt={variant.name}
                      className="object-cover"
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      src={variant.effectiveImageUrls[0]}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Chưa có ảnh biến thể
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {variant.category.name}
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">{variant.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sản phẩm gốc: <span className="font-semibold text-foreground">{variant.product.name}</span>
              </p>
              <div className="mt-6 grid gap-3 border border-border p-4 text-sm">
                <p>
                  SKU: <span className="font-semibold">{variant.sku}</span>
                </p>
                <p>
                  Slug: <span className="font-semibold">{variant.slug}</span>
                </p>
                <p>
                  Thương hiệu: <span className="font-semibold">{variant.brand?.name ?? "Không gắn thương hiệu"}</span>
                </p>
                <p>
                  Tồn kho: <span className="font-semibold">{variant.stockQuantity}</span>
                </p>
                <p>
                  Số lượng đặt tối thiểu: <span className="font-semibold">{variant.minOrderQuantity}</span>
                </p>
              </div>

              <div className="mt-6 border border-border">
                <div className="border-b border-border bg-muted/20 px-4 py-3">
                  <h2 className="text-sm font-semibold">Thông số kỹ thuật</h2>
                </div>
                {technicalSpecs.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Sản phẩm chưa có thông số kỹ thuật.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-sm">
                      <thead>
                        <tr className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          <th className="border-b border-border px-4 py-2 text-left">Tên thông số</th>
                          <th className="border-b border-border px-4 py-2 text-left">Giá trị</th>
                          <th className="w-24 border-b border-border px-4 py-2 text-left">Đơn vị</th>
                        </tr>
                      </thead>
                      <tbody>
                        {technicalSpecs.map((spec) => (
                          <tr key={spec.key} className="border-t border-border">
                            <td className="px-4 py-2">{spec.label}</td>
                            <td className="px-4 py-2 font-medium">{spec.value}</td>
                            <td className="px-4 py-2 text-muted-foreground">{spec.unit || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <aside className="border border-border bg-muted/20 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Giá bán</p>
              <p className="mt-2 text-3xl font-black text-primary">{variant.price.toLocaleString("vi-VN")} đ</p>
              <button
                className="mt-6 inline-flex h-11 w-full cursor-pointer items-center justify-center border border-border bg-background px-4 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                type="button"
              >
                Liên hệ đặt hàng
              </button>
            </aside>
          </article>
        )}
      </section>
    </main>
  );
}
