import { getCatalogVariantPricingDisplay } from "@/lib/catalog/pricing";
import type { CatalogVariant } from "@/lib/catalog/types";
import type { Brand } from "@/lib/brand/types";
import type { PublicPromotionDetail } from "@/lib/promotion/types";
import { isContactForPrice } from "@/lib/pricing-status";
import {
  absoluteUrl,
  SHOP_AHSO_CONTACT,
  SHOP_AHSO_DESCRIPTION,
  SITE_URL,
  stripHtml,
  truncateSeoText,
} from "@/lib/seo/config";

type BreadcrumbItem = {
  name: string;
  url: string;
};

function getPrimaryVariantImage(variant: CatalogVariant) {
  return variant.effectiveImageUrls[0] ? absoluteUrl(variant.effectiveImageUrls[0]) : absoluteUrl("/logo.png");
}

function getVariantDescription(variant: CatalogVariant) {
  const description = stripHtml(variant.product.description ?? "");
  if (description) {
    return truncateSeoText(description, 220);
  }

  return truncateSeoText(`${variant.name} thuộc dòng ${variant.product.name}, thương hiệu ${variant.brand?.name ?? "ShopAHSO"}.`, 220);
}

export function buildOrganizationJsonLd() {
  const organizationId = `${SITE_URL}/#organization`;
  const address = {
    "@type": "PostalAddress",
    addressCountry: SHOP_AHSO_CONTACT.addressCountry,
    addressLocality: SHOP_AHSO_CONTACT.addressLocality,
    addressRegion: SHOP_AHSO_CONTACT.addressRegion,
    streetAddress: SHOP_AHSO_CONTACT.streetAddress,
  };

  return [
    {
      "@context": "https://schema.org",
      "@id": organizationId,
      "@type": "Organization",
      description: SHOP_AHSO_DESCRIPTION,
      email: SHOP_AHSO_CONTACT.email,
      logo: absoluteUrl("/logo.png"),
      name: SHOP_AHSO_CONTACT.name,
      sameAs: ["https://ahso.vn"],
      telephone: SHOP_AHSO_CONTACT.phone,
      url: SITE_URL,
    },
    {
      "@context": "https://schema.org",
      "@id": `${SITE_URL}/#localbusiness`,
      "@type": "LocalBusiness",
      address,
      areaServed: {
        "@type": "Country",
        name: "Việt Nam",
      },
      description: SHOP_AHSO_DESCRIPTION,
      email: SHOP_AHSO_CONTACT.email,
      image: absoluteUrl("/logo.png"),
      name: SHOP_AHSO_CONTACT.name,
      parentOrganization: {
        "@id": organizationId,
      },
      priceRange: "$$",
      telephone: SHOP_AHSO_CONTACT.phone,
      url: SITE_URL,
    },
  ];
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      item: absoluteUrl(item.url),
      name: item.name,
      position: index + 1,
    })),
  };
}

export function buildProductJsonLd(variant: CatalogVariant) {
  const pricing = getCatalogVariantPricingDisplay({
    discountPercent: variant.discountPercent,
    price: variant.price,
    pricing: variant.pricing,
    salePrice: variant.salePrice,
    tax: variant.tax,
  });
  const effectivePrice = Number(pricing.effectivePrice ?? variant.price);
  const requiresQuote = isContactForPrice(variant.pricingStatus);
  const productUrl = absoluteUrl(`/san-pham/${variant.slug}`);
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    brand: variant.brand
      ? {
          "@type": "Brand",
          name: variant.brand.name,
          url: absoluteUrl(`/thuong-hieu/${variant.brand.slug}`),
        }
      : undefined,
    category: variant.category.name,
    description: getVariantDescription(variant),
    image: variant.effectiveImageUrls.length > 0
      ? variant.effectiveImageUrls.map((imageUrl) => absoluteUrl(imageUrl))
      : [absoluteUrl("/logo.png")],
    mpn: variant.sku,
    name: variant.name,
    sku: variant.sku,
    url: productUrl,
  };

  if (!requiresQuote && Number.isFinite(effectivePrice) && effectivePrice > 0) {
    schema.offers = {
      "@type": "Offer",
      availability: variant.stockQuantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      price: effectivePrice,
      priceCurrency: "VND",
      seller: {
        "@id": `${SITE_URL}/#organization`,
      },
      url: productUrl,
    };
  }

  const ratingCount = Number(variant.rating?.count ?? variant.ratingCount ?? 0);
  const ratingAverage = Number(variant.rating?.average ?? variant.ratingAverage ?? 0);
  if (ratingCount > 0 && Number.isFinite(ratingAverage) && ratingAverage > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingCount,
      ratingValue: ratingAverage,
    };
  }

  return schema;
}

export function buildProductBreadcrumbJsonLd(variant: CatalogVariant) {
  return buildBreadcrumbJsonLd([
    { name: "Trang chủ", url: "/" },
    { name: "Sản phẩm", url: "/san-pham" },
    { name: variant.category.name, url: `/san-pham?categorySlug=${variant.category.slug}` },
    { name: variant.name, url: `/san-pham/${variant.slug}` },
  ]);
}

export function buildBrandBreadcrumbJsonLd(brand: Brand) {
  return buildBreadcrumbJsonLd([
    { name: "Trang chủ", url: "/" },
    { name: "Thương hiệu", url: "/thuong-hieu" },
    { name: brand.name, url: `/thuong-hieu/${brand.slug}` },
  ]);
}

export function buildPromotionBreadcrumbJsonLd(promotion: PublicPromotionDetail) {
  return buildBreadcrumbJsonLd([
    { name: "Trang chủ", url: "/" },
    { name: "Khuyến mãi", url: "/khuyen-mai" },
    { name: promotion.name, url: `/khuyen-mai/${promotion.slug}` },
  ]);
}

export function getProductSeoDescription(variant: CatalogVariant) {
  return truncateSeoText(
    `${variant.name} - SKU ${variant.sku}. Xem giá, tồn kho, datasheet và thông số kỹ thuật tại ShopAHSO.`,
  );
}

export function getBrandSeoDescription(brand: Brand) {
  return truncateSeoText(`Xem sản phẩm ${brand.name} chính hãng, tồn kho và báo giá tại ShopAHSO.`);
}

export function getPromotionSeoDescription(promotion: PublicPromotionDetail) {
  return truncateSeoText(promotion.description?.trim() || `Chương trình ${promotion.name} tại ShopAHSO.`);
}

export function getProductSeoImage(variant: CatalogVariant) {
  return getPrimaryVariantImage(variant);
}
