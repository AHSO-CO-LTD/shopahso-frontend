import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type {
  CreateVariantPayload,
  UpdateVariantPayload,
  VariantSummary,
} from "@/lib/product/types";

export function listBackofficeVariants() {
  return authenticatedApiRequest<VariantSummary[]>("/backoffice/variants", {
    method: "GET",
  });
}

export function getBackofficeVariant(id: string) {
  return authenticatedApiRequest<VariantSummary>(`/backoffice/variants/${id}`, {
    method: "GET",
  });
}

export function createBackofficeVariant(payload: CreateVariantPayload) {
  return authenticatedApiRequest<VariantSummary>("/backoffice/variants", {
    body: payload,
    method: "POST",
  });
}

export function updateBackofficeVariant(id: string, payload: UpdateVariantPayload) {
  return authenticatedApiRequest<VariantSummary>(`/backoffice/variants/${id}`, {
    body: payload,
    method: "PATCH",
  });
}

export function deleteBackofficeVariant(id: string) {
  return authenticatedApiRequest<VariantSummary>(`/backoffice/variants/${id}`, {
    method: "DELETE",
  });
}
