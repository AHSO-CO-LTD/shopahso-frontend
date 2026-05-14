import { apiRequest } from "@/lib/api/client";
import type { Brand } from "@/lib/brand/types";
import type { CategoryTreeNode } from "@/lib/category/types";
import type {
  CatalogFeaturedBrand,
  CatalogFeaturedProduct,
  CatalogProductFilterOption,
  CatalogVariant,
  CatalogVariantSearchResponse,
} from "@/lib/catalog/types";

type CatalogVariantQuery = {
  brandId?: string;
  categoryId?: string;
  limit?: number;
  priceMax?: number;
  priceMin?: number;
} & Record<string, string | number | boolean | undefined>;

type CatalogVariantSearchQuery = {
  q?: string;
  productId?: string;
  categoryId?: string;
  brandId?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: "relevance" | "score" | "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
} & Record<string, string | number | boolean | undefined>;

export function listCatalogVariants(query: CatalogVariantQuery = {}) {
  return apiRequest<CatalogVariant[]>("/catalog/variants", {
    method: "GET",
    query,
  });
}

export function searchCatalogVariants(query: CatalogVariantSearchQuery) {
  return apiRequest<CatalogVariantSearchResponse>("/catalog/variants/search", {
    method: "GET",
    query,
  });
}

export function getCatalogVariantBySlug(slug: string) {
  return apiRequest<CatalogVariant>(`/catalog/variants/${slug}`, {
    method: "GET",
  });
}

export function listCatalogBrands() {
  return apiRequest<Brand[]>("/catalog/brands", {
    method: "GET",
  });
}

export function listCatalogCategoriesTree() {
  return apiRequest<CategoryTreeNode[]>("/catalog/categories/tree", {
    method: "GET",
  });
}

export function listCatalogFeaturedProducts() {
  return apiRequest<CatalogFeaturedProduct[]>("/catalog/products/featured", {
    method: "GET",
  });
}

export function listCatalogNewestProducts() {
  return apiRequest<CatalogFeaturedProduct[]>("/catalog/products/newest", {
    method: "GET",
  });
}

export function listCatalogFeaturedBrands() {
  return apiRequest<CatalogFeaturedBrand[]>("/catalog/brands/featured", {
    method: "GET",
  });
}

type CatalogProductsResponse =
  | CatalogProductFilterOption[]
  | { items: CatalogProductFilterOption[] };

export function listCatalogProducts() {
  return apiRequest<CatalogProductsResponse>("/catalog/products", {
    method: "GET",
  });
}
