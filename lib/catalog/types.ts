import type { PricingStatus } from "@/lib/pricing-status";

export type CatalogVariantCategory = {
  id: string;
  name: string;
  slug: string;
};

export type CatalogVariantBrand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export type CatalogVariantProduct = {
  id: string;
  name: string;
  slug: string;
};

export type CatalogVariantTax = {
  source: "VARIANT" | "PRODUCT" | "CATEGORY" | "GLOBAL" | string;
  targetId: string | null;
  percent: string;
};

export type CatalogVariantPricing = {
  effectivePrice: string;
  taxAmount: string;
  totalWithTax: string;
};

export type CatalogVariantAttributeValue = {
  id?: string;
  code: string;
  dataType?: "TEXT" | "NUMBER" | "BOOLEAN" | "ENUM";
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueEnum?: string | null;
  definition?: {
    id?: string;
    name?: string;
    unit?: string | null;
    code?: string;
  };
};

export type CatalogVariant = {
  id: string;
  slug: string;
  sku: string;
  originCountryCode?: string | null;
  name: string;
  effectiveImageUrls: string[];
  price: number | string;
  pricingStatus: PricingStatus;
  costPrice?: number | string | null;
  salePrice?: number | string | null;
  discountPercent?: number | string | null;
  taxPercent?: number | string | null;
  tax?: CatalogVariantTax | null;
  pricing?: CatalogVariantPricing | null;
  stockQuantity: number;
  unit: string | null;
  minOrderQuantity: number;
  score: number;
  active: boolean;
  specSnapshot?: Record<string, unknown> | null;
  attributeValues?: CatalogVariantAttributeValue[];
  category: CatalogVariantCategory;
  brand: CatalogVariantBrand | null;
  product: CatalogVariantProduct;
};

export type CatalogVariantSearchResponse = {
  items: CatalogVariant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CatalogFeaturedProduct = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  imageUrls: string[];
  effectiveImageUrls: string[];
  featuredScore?: string | number;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand?: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  } | null;
  variants: Array<{
    id: string;
    sku: string;
    name: string;
    slug: string;
    pricingStatus?: PricingStatus;
    imageUrls: string[];
    effectiveImageUrls?: string[];
    tax?: CatalogVariantTax | null;
    pricing?: CatalogVariantPricing | null;
  }>;
};

export type CatalogFeaturedBrand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  active: boolean;
  featuredOrderCount: number;
  featuredVariantCount: number;
};

export type CatalogProductFilterOption = {
  id: string;
  name: string;
  slug: string;
};
