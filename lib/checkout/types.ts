import type { CartItem } from "@/lib/cart/types";
import type { UserAddress } from "@/lib/user-address/types";

export type CheckoutIssueCode =
  | "VARIANT_UNAVAILABLE"
  | "PRODUCT_NOT_PUBLISHED"
  | "OUT_OF_STOCK"
  | "QUANTITY_EXCEEDS_STOCK"
  | "QUANTITY_BELOW_MIN_ORDER"
  | "PRICE_CHANGED";

export type CheckoutIssue = {
  code: CheckoutIssueCode | string;
  message?: string;
  cartItemId?: string;
  variantId?: string;
};

export type CheckoutPreviewSummary = {
  itemCount: number;
  totalQuantity: number;
  subtotalAmount: string;
  taxAmount: string;
  shippingFee: string;
  discountAmount: string;
  grandTotalAmount: string;
};

export type CheckoutPreview = {
  canCheckout: boolean;
  items: CartItem[];
  issues?: CheckoutIssue[];
  voucher: unknown | null;
  summary: CheckoutPreviewSummary;
};

export type CheckoutShippingAddress = {
  name: string;
  phoneNumber?: string;
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  streetAddress: string;
  note?: string;
};

export type CheckoutInvoiceAddress = {
  name: string;
  phone?: string;
  companyName: string;
  taxCode: string;
  email: string;
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  streetAddress: string;
};

export type CreateCheckoutOrderPayload = {
  cartItemIds: string[];
  shippingAddressId?: string;
  shippingAddress?: CheckoutShippingAddress;
  customerEmail?: string;
  customerName: string;
  customerPhone?: string;
  invoiceRequested?: boolean;
  invoiceAddressId?: string;
  invoiceAddress?: CheckoutInvoiceAddress;
  voucherCode?: string;
  customerNote?: string;
};

export type CheckoutOrderItem = {
  id: string;
  productId?: string;
  productSlug?: string;
  productSlugSnapshot?: string;
  variantId?: string;
  variantSlug?: string;
  variantSlugSnapshot?: string;
  slug?: string;
  quantity?: number;
  productName?: string;
  productNameSnapshot?: string;
  variantName?: string;
  variantNameSnapshot?: string;
  sku?: string;
  skuSnapshot?: string;
  imageUrlSnapshot?: string | null;
  unitSnapshot?: string | null;
  priceSnapshot?: string;
  salePriceSnapshot?: string | null;
  effectivePriceSnapshot?: string;
  taxAmount?: string;
  subtotalAmount?: string;
  totalAmount?: string;
};

export type CheckoutOrder = {
  id: string;
  orderCode: string;
  userId: string | null;
  guestToken: string | null;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string | null;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  grandTotalAmount: string;
  paymentMethod: string;
  paymentProvider: string | null;
  paymentBankCode?: string | null;
  paymentBankName?: string | null;
  paymentBankAccountNumber?: string | null;
  paymentBankAccountName?: string | null;
  paymentQrUrl: string | null;
  paymentTransferContent: string | null;
  paymentRejectReason?: string | null;
  staffNote?: string | null;
  cancelledAt?: string | null;
  completedAt?: string | null;
  items: CheckoutOrderItem[];
  shippingAddress?: UserAddress | CheckoutShippingAddress | null;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderLookupPayload = {
  orderCode: string;
  email: string;
};
