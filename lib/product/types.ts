import type { Brand } from "@/lib/brand/types";
import type { BackofficeCategory } from "@/lib/category/types";

export type ProductVariantCount = {
  variants: number;
  attributes: number;
};

export type ProductSummary = {
  id: string;
  categoryId: string;
  brandId: string | null;
  name: string;
  slug: string;
  description: string | null;
  datasheetUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  category: BackofficeCategory;
  brand: Brand | null;
  _count: ProductVariantCount;
};

export type VariantSummary = {
  id: string;
  productId: string;
  categoryId: string;
  brandId: string | null;
  sku: string;
  manufacturerPartNumber: string | null;
  name: string;
  slug: string;
  price: number;
  stockQuantity: number;
  unit: string | null;
  minOrderQuantity: number;
  score: number;
  viewCount: number;
  orderCount: number;
  specSnapshot: Record<string, unknown> | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  category: BackofficeCategory;
  brand: Brand | null;
  product: ProductSummary;
};

export type ProductDetail = ProductSummary & {
  variants: VariantSummary[];
};

export type CreateProductPayload = {
  categoryId: string;
  brandId?: string;
  name: string;
  slug: string;
  description?: string;
  datasheetUrl?: string;
  active?: boolean;
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type CreateVariantPayload = {
  productId: string;
  sku: string;
  manufacturerPartNumber?: string;
  name: string;
  slug: string;
  price: number;
  stockQuantity: number;
  unit?: string;
  minOrderQuantity: number;
  score: number;
  viewCount: number;
  orderCount: number;
  specSnapshot: Record<string, unknown>;
  active?: boolean;
};

export type UpdateVariantPayload = Partial<CreateVariantPayload>;
