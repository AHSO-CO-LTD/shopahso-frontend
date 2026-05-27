export type QuoteRequestStatus = "PENDING" | "QUOTED" | "CANCELLED" | "CLOSED";

export type QuoteRequestStaff = {
  id: string;
  fullName?: string | null;
  email?: string | null;
};

export type QuoteRequestProduct = {
  id?: string;
  name?: string;
  slug?: string;
  imageUrls?: string[];
  effectiveImageUrls?: string[];
};

export type QuoteRequestVariant = {
  id?: string;
  name?: string;
  sku?: string;
  slug?: string;
  imageUrls?: string[];
  effectiveImageUrls?: string[];
  pricingStatus?: string;
};

export type QuoteRequest = {
  id: string;
  requestCode: string;
  requestGroupCode: string;
  userId?: string | null;
  productId?: string;
  variantId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  customerNote?: string | null;
  status: QuoteRequestStatus;
  staffNote?: string | null;
  claimedByStaffId?: string | null;
  claimedAt?: string | null;
  quotedAt?: string | null;
  cancelledAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  product?: QuoteRequestProduct | null;
  variant?: QuoteRequestVariant | null;
  claimedByStaff?: QuoteRequestStaff | null;
};

export type CreateQuoteRequestPayload = {
  variantIds: string[];
  fullName: string;
  email: string;
  phoneNumber: string;
  quantity?: number;
  note?: string;
};

export type CreateQuoteRequestResponse = {
  requestGroupCode: string;
  items: QuoteRequest[];
};

export type QuoteRequestFilters = {
  status?: QuoteRequestStatus;
};

export type BackofficeQuoteRequestFilters = QuoteRequestFilters & {
  requestCode?: string;
  email?: string;
  phoneNumber?: string;
};

export type QuoteRequestClaimPayload = {
  staffNote?: string;
};

export type QuoteRequestStatusPayload = {
  status: QuoteRequestStatus;
  staffNote?: string;
};
