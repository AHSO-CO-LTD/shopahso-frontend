import type { CatalogVariant } from "@/lib/catalog/types";
import type { VariantSummary } from "@/lib/product/types";

export type PromotionStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED";
export type PromotionDiscountType = "PERCENT" | "FIXED_AMOUNT";

export type PromotionCount = {
  items: number;
};

export type PromotionSummary = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  bannerImageUrl?: string | null;
  bannerImagePublicId?: string | null;
  bannerLinkUrl?: string | null;
  defaultDiscountType: PromotionDiscountType;
  defaultDiscountValue: string | number;
  status: PromotionStatus;
  startsAt?: string | null;
  endsAt?: string | null;
  _count?: PromotionCount;
  createdAt?: string;
  updatedAt?: string;
};

export type PromotionVariantUsage = Record<string, { promotionId: string; promotionName: string; promotionStatus: PromotionStatus }>;

export type BackofficePromotionVariant = Partial<VariantSummary> & {
  id: string;
  name: string;
  sku: string;
  price: string | number;
  salePrice?: string | number | null;
  discountPercent?: string | number | null;
};

export type PromotionItem = {
  id: string;
  promotionId: string;
  variantId: string;
  discountType?: PromotionDiscountType | null;
  discountValue?: string | number | null;
  variant: BackofficePromotionVariant;
};

export type PromotionDetail = PromotionSummary & {
  items: PromotionItem[];
};

export type PublicPromotionItem = {
  id: string;
  promotionId: string;
  variantId: string;
  discountType?: PromotionDiscountType | null;
  discountValue?: string | number | null;
  variant: CatalogVariant;
};

export type PublicPromotionDetail = PromotionSummary & {
  items: PublicPromotionItem[];
};

export type PromotionItemPayload = {
  variantId: string;
  discountType?: PromotionDiscountType | null;
  discountValue?: number | null;
};

export type CreatePromotionPayload = {
  name: string;
  slug: string;
  description?: string;
  bannerImageUrl?: string;
  bannerLinkUrl?: string;
  defaultDiscountType: PromotionDiscountType;
  defaultDiscountValue: number;
  status?: PromotionStatus;
  startsAt?: string;
  endsAt?: string | null;
  items?: PromotionItemPayload[];
};

export type UpdatePromotionPayload = Partial<CreatePromotionPayload>;
