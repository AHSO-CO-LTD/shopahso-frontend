import type { PricingStatus } from "@/lib/pricing-status";
import type { PricingDiscount } from "@/lib/pricing-discount";

export type CartProduct = {
  id: string;
  name: string;
  slug: string;
};

export type CartVariant = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  originCountryCode?: string | null;
  pricingStatus?: PricingStatus;
  unit: string | null;
  imageUrls: string[];
};

export type CartPriceSnapshot = {
  productName: string;
  variantName: string;
  price: string;
  salePrice: string | null;
  discountPercent?: string | number | null;
  discountAmount?: string | number | null;
  discount?: PricingDiscount | null;
  pricingStatus?: PricingStatus;
  effectivePrice: string;
  imageUrl: string | null;
  subtotal: string;
};

export type CartCurrentPrice = {
  price: string;
  salePrice: string | null;
  discountPercent?: string | number | null;
  discountAmount?: string | number | null;
  discount?: PricingDiscount | null;
  pricingStatus?: PricingStatus;
  effectivePrice: string;
  subtotal: string;
  tax?: {
    source: string;
    targetId: string | null;
    percent: string;
    amount: string;
  };
  totalWithTax?: string;
};

export type CartItem = {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  minOrderQuantity: number;
  stockQuantity: number;
  available: boolean;
  product: CartProduct;
  variant: CartVariant;
  snapshot: CartPriceSnapshot;
  current: CartCurrentPrice;
  priceChanged: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CartSummary = {
  itemCount: number;
  totalQuantity: number;
  subtotalSnapshot: string;
  subtotalCurrent: string;
  taxTotalCurrent?: string;
  totalCurrentWithTax?: string;
  priceChanged: boolean;
};

export type Cart = {
  id: string;
  userId: string | null;
  guestToken: string | null;
  items: CartItem[];
  summary: CartSummary;
  createdAt: string;
  updatedAt: string;
};
