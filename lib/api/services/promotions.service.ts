import { apiRequest } from "@/lib/api/client";
import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type { CatalogVariant } from "@/lib/catalog/types";
import type {
  CreatePromotionPayload,
  PromotionDetail,
  PromotionItemPayload,
  PromotionStatus,
  PromotionSummary,
  PublicPromotionDetail,
  UpdatePromotionPayload,
} from "@/lib/promotion/types";

type PromotionListQuery = {
  q?: string;
  status?: PromotionStatus | "";
};

function normalizeVariantList(response: CatalogVariant[] | { items?: CatalogVariant[] }) {
  return Array.isArray(response) ? response : response.items ?? [];
}

export function listBackofficePromotions(query: PromotionListQuery = {}) {
  return authenticatedApiRequest<PromotionSummary[]>("/backoffice/promotions", {
    method: "GET",
    query,
  });
}

export function getBackofficePromotion(id: string) {
  return authenticatedApiRequest<PromotionDetail>(`/backoffice/promotions/${id}`, {
    method: "GET",
  });
}

export function createBackofficePromotion(payload: CreatePromotionPayload) {
  return authenticatedApiRequest<PromotionDetail>("/backoffice/promotions", {
    body: payload,
    method: "POST",
  });
}

export function updateBackofficePromotion(id: string, payload: UpdatePromotionPayload) {
  return authenticatedApiRequest<PromotionDetail>(`/backoffice/promotions/${id}`, {
    body: payload,
    method: "PATCH",
  });
}

export function endBackofficePromotion(id: string) {
  return authenticatedApiRequest<PromotionDetail>(`/backoffice/promotions/${id}/end`, {
    method: "PATCH",
  });
}

export function addBackofficePromotionItem(id: string, payload: PromotionItemPayload) {
  return authenticatedApiRequest<PromotionDetail>(`/backoffice/promotions/${id}/items`, {
    body: payload,
    method: "POST",
  });
}

export function updateBackofficePromotionItem(
  id: string,
  itemId: string,
  payload: Omit<PromotionItemPayload, "variantId">,
) {
  return authenticatedApiRequest<PromotionDetail>(`/backoffice/promotions/${id}/items/${itemId}`, {
    body: payload,
    method: "PATCH",
  });
}

export function deleteBackofficePromotionItem(id: string, itemId: string) {
  return authenticatedApiRequest<PromotionDetail>(`/backoffice/promotions/${id}/items/${itemId}`, {
    method: "DELETE",
  });
}

export function uploadBackofficePromotionBanner(id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return authenticatedApiRequest<PromotionDetail>(`/backoffice/promotions/${id}/banner-image`, {
    body: formData,
    method: "POST",
  });
}

export function deleteBackofficePromotion(id: string) {
  return authenticatedApiRequest<{ deleted: boolean }>(`/backoffice/promotions/${id}`, {
    method: "DELETE",
  });
}

export function listPublicPromotions() {
  return apiRequest<PromotionSummary[]>("/promotions", {
    method: "GET",
  });
}

export function getPublicPromotionBySlug(slug: string) {
  return apiRequest<PublicPromotionDetail>(`/promotions/${slug}`, {
    method: "GET",
  });
}

export async function listPublicDiscountedVariants() {
  const response = await apiRequest<CatalogVariant[] | { items?: CatalogVariant[] }>(
    "/promotions/discounted-variants",
    {
      method: "GET",
    },
  );

  return normalizeVariantList(response);
}
