import { formatCatalogMoney, getCatalogPricingDisplay, getCatalogVariantPricingDisplay } from "@/lib/catalog/pricing";
import type { CatalogFeaturedProduct, CatalogVariant } from "@/lib/catalog/types";
import { FALLBACK_LOGO_IMAGE } from "@/lib/image-fallbacks";
import { isContactForPrice } from "@/lib/pricing-status";

export type HomeProductCardItem = {
  badge?: string;
  brandName: string;
  categoryName: string;
  href: string;
  id: string;
  imageUrl: string;
  isFallbackImage: boolean;
  meta?: string;
  name: string;
  originalPriceLabel?: string;
  priceLabel: string;
  productName?: string;
  sku: string;
};

export function mapFeaturedProductToHomeCard(
  product: CatalogFeaturedProduct,
  badge?: string,
): HomeProductCardItem {
  const topVariant = product.variants[0];
  const imageUrl = topVariant?.effectiveImageUrls?.[0] ?? product.effectiveImageUrls?.[0] ?? FALLBACK_LOGO_IMAGE;
  const pricing = topVariant?.pricing
    ? getCatalogPricingDisplay({
        fallbackPrice: topVariant.pricing.effectivePrice,
        pricing: topVariant.pricing,
        regularPrice: topVariant.price,
        tax: topVariant.tax,
      })
    : null;

  return {
    badge: pricing?.isDiscounted && pricing.discountBadge ? pricing.discountBadge : badge,
    brandName: product.brand?.name ?? "AHSO",
    categoryName: product.category?.name ?? "Catalog",
    href: `/san-pham/${topVariant?.slug ?? product.slug}`,
    id: product.id,
    imageUrl,
    isFallbackImage: imageUrl === FALLBACK_LOGO_IMAGE,
    meta: topVariant?.orderCount ? `${topVariant.orderCount.toLocaleString("vi-VN")} lượt mua` : undefined,
    name: product.name,
    originalPriceLabel: pricing?.isDiscounted ? formatCatalogMoney(pricing.originalPrice) : undefined,
    priceLabel: pricing ? formatCatalogMoney(pricing.effectivePrice) : "Liên hệ báo giá",
    productName: product.name,
    sku: topVariant?.sku ?? "Đang cập nhật",
  };
}

export function mapVariantToHomeCard(variant: CatalogVariant, badge?: string): HomeProductCardItem {
  const pricing = getCatalogVariantPricingDisplay(variant);
  const hasDiscount = pricing.isDiscounted && !isContactForPrice(variant.pricingStatus);
  const imageUrl = variant.effectiveImageUrls?.[0] ?? FALLBACK_LOGO_IMAGE;

  return {
    badge: hasDiscount && pricing.discountBadge ? pricing.discountBadge : badge,
    brandName: variant.brand?.name ?? "AHSO",
    categoryName: variant.category.name,
    href: `/san-pham/${variant.slug}`,
    id: variant.id,
    imageUrl,
    isFallbackImage: imageUrl === FALLBACK_LOGO_IMAGE,
    meta: variant.orderCount ? `${variant.orderCount.toLocaleString("vi-VN")} lượt mua` : undefined,
    name: variant.name,
    originalPriceLabel: hasDiscount ? formatCatalogMoney(pricing.originalPrice) : undefined,
    priceLabel: isContactForPrice(variant.pricingStatus)
      ? "Liên hệ báo giá"
      : formatCatalogMoney(pricing.effectivePrice),
    productName: variant.product.name,
    sku: variant.sku,
  };
}

export function hasVariantDiscount(variant: CatalogVariant) {
  const pricing = getCatalogVariantPricingDisplay(variant);

  return Boolean(
    !isContactForPrice(variant.pricingStatus) &&
      pricing.isDiscounted,
  );
}
