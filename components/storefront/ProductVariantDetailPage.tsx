"use client";

import Image from "next/image";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ProductDescriptionRenderer from "@/components/storefront/ProductDescriptionRenderer";
import RelatedVariantCarousel from "@/components/storefront/RelatedVariantCarousel";
import VariantEngagementMetrics from "@/components/storefront/VariantEngagementMetrics";
import { getCatalogProductBySlug, getCatalogVariantBySlug } from "@/lib/api/services/catalog-variants.service";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import QuoteRequestModal from "@/components/quote-requests/QuoteRequestModal";
import { getCatalogVariantPricingDisplay } from "@/lib/catalog/pricing";
import type { CatalogVariant, CatalogVariantAttributeValue } from "@/lib/catalog/types";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import { FALLBACK_LOGO_IMAGE } from "@/lib/image-fallbacks";
import { getPricingStatusBadgeClass, getPricingStatusLabel, isContactForPrice } from "@/lib/pricing-status";

type DisplaySpec = {
  key: string;
  label: string;
  value: string;
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

function formatMoney(value: string | number | null | undefined) {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) {
    return "0 đ";
  }

  return numericValue.toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  }) + " đ";
}

export default function ProductVariantDetailPage({ slug }: { slug: string }) {
  const [variant, setVariant] = useState<CatalogVariant | null>(null);
  const [relatedVariants, setRelatedVariants] = useState<CatalogVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRelatedLoading, setIsRelatedLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [relatedErrorMessage, setRelatedErrorMessage] = useState<string | null>(null);
  const [quoteVariant, setQuoteVariant] = useState<CatalogVariant | null>(null);

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

          return {
            key: item.id ?? fallbackCode,
            label,
            value,
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
          };
        })
        .filter((item): item is DisplaySpec => item !== null);
    }

    return [];
  }, [variant]);

  const taxPreview = useMemo(() => {
    if (!variant) {
      return null;
    }

    return getCatalogVariantPricingDisplay({
      discountPercent: variant.discountPercent,
      price: variant.price,
      pricing: variant.pricing,
      salePrice: variant.salePrice,
      tax: variant.tax,
    });
  }, [variant]);
  const requiresQuote = isContactForPrice(variant?.pricingStatus);
  const detailImageUrl = variant?.effectiveImageUrls?.[0] ?? FALLBACK_LOGO_IMAGE;
  const isDetailFallbackImage = detailImageUrl === FALLBACK_LOGO_IMAGE;
  const productDescription = (variant?.product.description ?? "").trim();

  useEffect(() => {
    async function loadVariant() {
      setIsLoading(true);
      setIsRelatedLoading(false);
      setErrorMessage(null);
      setRelatedErrorMessage(null);
      setRelatedVariants([]);

      try {
        const response = await getCatalogVariantBySlug(slug);
        setVariant(response);

        if (response.product.slug) {
          setIsRelatedLoading(true);
          try {
            const productDetail = await getCatalogProductBySlug(response.product.slug);
            setRelatedVariants(productDetail.variants ?? []);
          } catch (productError) {
            const message =
              productError instanceof Error
                ? productError.message
                : "Không thể tải danh sách sản phẩm cùng dòng.";
            setRelatedErrorMessage(message);
            toast.error(message);
          } finally {
            setIsRelatedLoading(false);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Không thể tải chi tiết sản phẩm.";
        setErrorMessage(message);
        toast.error(message);
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
          <>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
              <article className="border border-border bg-background p-6">
              <div className="mb-5 border border-border bg-muted/15">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    alt={variant.name}
                    className={isDetailFallbackImage ? "object-contain p-12" : "object-contain"}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    src={detailImageUrl}
                  />
                </div>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {variant.category.name}
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">{variant.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Dòng sản phẩm: <span className="font-semibold text-foreground">{variant.product.name}</span>
              </p>
              <VariantEngagementMetrics className="mt-4" variant={variant} />
              {requiresQuote ? (
                <span className={`mt-4 inline-flex border px-2 py-1 text-[11px] font-semibold ${getPricingStatusBadgeClass(variant.pricingStatus)}`}>
                  {getPricingStatusLabel(variant.pricingStatus)}
                </span>
              ) : null}

              <section className="mt-6 border border-border">
                <div className="border-b border-border bg-muted/20 px-4 py-3">
                  <h2 className="text-sm font-semibold">Thông tin sản phẩm</h2>
                </div>
                <div className="grid gap-3 p-4 text-sm sm:grid-cols-2">
                  <ProductInfoItem className="sm:col-span-2" label="SKU" value={variant.sku} />
                  <ProductInfoItem label="Thương hiệu" value={variant.brand?.name ?? "Không gắn thương hiệu"} />
                  <ProductInfoItem label="Xuất xứ" value={variant.originCountryCode ?? "Chưa có"} />
                  <ProductInfoItem label="Tồn kho" value={String(variant.stockQuantity)} />
                  <ProductInfoItem label="Số lượng đặt tối thiểu" value={String(variant.minOrderQuantity)} />
                </div>
              </section>

              {variant.product.datasheetUrl ? (
                <div className="mt-6">
                  <a
                    className="inline-flex h-10 items-center gap-2 border border-border bg-muted/30 px-4 text-sm font-semibold transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
	                    href={variant.product.datasheetUrl}
	                    onClick={() => {
	                      trackAnalyticsEvent("view_datasheet", {
	                        datasheet_url: variant.product.datasheetUrl,
	                        product_slug: variant.product.slug,
	                        sku: variant.sku,
	                        variant_id: variant.id,
	                      });
	                    }}
	                    rel="noopener noreferrer"
	                    target="_blank"
                  >
                    <FileText className="size-4" />
                    Tải Datasheet (PDF)
                  </a>
                </div>
              ) : null}

              <section className="mt-6 border border-border">
                <div className="border-b border-border bg-muted/20 px-4 py-3">
                  <h2 className="text-sm font-semibold">Mô tả sản phẩm</h2>
                </div>
                {productDescription ? (
                  <ProductDescriptionRenderer html={productDescription} />
                ) : (
                  <ProductDescriptionRenderer html={null} />
                )}
              </section>

              </article>
              <aside className="border border-border bg-muted/20 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
              <section className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Giá bán</p>
                {requiresQuote ? (
                  <div className="mt-2">
                    <p className="text-3xl font-black text-primary">Liên hệ báo giá</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Sản phẩm này cần xác nhận giá theo số lượng, tồn kho và thời điểm đặt hàng.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-3xl font-black text-primary">
                      {formatMoney(taxPreview?.effectivePrice ?? variant.price)}
                    </p>
                    <div className="mt-4 grid gap-2 border border-border bg-background p-3 text-sm">
                      {taxPreview?.isDiscounted ? (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Giá gốc</span>
                            <span className="font-semibold line-through">{formatMoney(taxPreview.originalPrice)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Ưu đãi</span>
                            <span className="font-black text-red-700">
                              {taxPreview.discountBadge || "Đang áp dụng"}
                            </span>
                          </div>
                          {taxPreview.discountSourceLabel ? (
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">Nguồn giảm</span>
                              <span className="font-semibold">{taxPreview.discountSourceLabel}</span>
                            </div>
                          ) : null}
                        </>
                      ) : null}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Giá trước thuế</span>
                        <span className="font-semibold">{formatMoney(taxPreview?.effectivePrice ?? variant.price)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Thuế</span>
                        <span className="font-semibold">
                          {taxPreview?.taxPercent ?? 0}% ({formatMoney(taxPreview?.taxAmount ?? 0)})
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                        <span className="font-semibold">Tổng sau thuế</span>
                        <span className="font-black text-primary">{formatMoney(taxPreview?.totalWithTax ?? variant.price)}</span>
                      </div>
                    </div>
                  </>
                )}
                <div className="mt-6 grid gap-2">
                  {!requiresQuote ? (
                    <AddToCartButton
                      active={variant.active}
                      className="h-11 w-full px-4"
                      pricingStatus={variant.pricingStatus}
                      stockQuantity={variant.stockQuantity}
                      variantId={variant.id}
                    />
                  ) : null}
                  {requiresQuote ? (
                    <button
                      className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 border border-yellow-500 bg-yellow-400 px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-yellow-500"
                      onClick={() => setQuoteVariant(variant)}
                      type="button"
                    >
                      <FileText className="size-4" />
                      Yêu cầu báo giá
                    </button>
                  ) : null}
                </div>
              </section>

              <section className="border-t border-border bg-background">
                <div className="border-b border-border bg-muted/20 px-4 py-3">
                  <h2 className="text-sm font-semibold">Thông số kỹ thuật</h2>
                </div>
                {technicalSpecs.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Sản phẩm chưa có thông số kỹ thuật.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed border-collapse text-sm">
                      <thead>
                        <tr className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          <th className="w-2/5 border-b border-border px-4 py-2 text-left">Tên thông số</th>
                          <th className="w-3/5 border-b border-border px-4 py-2 text-left">Giá trị</th>
                        </tr>
                      </thead>
                      <tbody>
                        {technicalSpecs.map((spec) => (
                          <tr key={spec.key} className="border-t border-border">
                            <td className="break-words px-4 py-2 text-muted-foreground">{spec.label}</td>
                            <td className="break-words px-4 py-2 font-medium">{spec.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              </aside>
            </div>
            {relatedErrorMessage ? (
              <div className="mt-8 border border-border bg-background p-4 text-sm text-muted-foreground">
                {relatedErrorMessage}
              </div>
            ) : (
              <RelatedVariantCarousel
                currentVariantId={variant.id}
                isLoading={isRelatedLoading}
                productName={variant.product.name}
                variants={relatedVariants}
                onRequestQuote={setQuoteVariant}
              />
            )}
          </>
        )}
      </section>
      <QuoteRequestModal
        open={Boolean(quoteVariant)}
        variant={quoteVariant}
        onClose={() => setQuoteVariant(null)}
      />
    </main>
  );
}

function ProductInfoItem({
  className = "",
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={`min-w-0 border border-border bg-background px-3 py-2 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-semibold">{value}</p>
    </div>
  );
}
