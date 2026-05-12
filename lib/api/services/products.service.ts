import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type {
  CreateProductPayload,
  ProductDetail,
  ProductSummary,
  UpdateProductPayload,
} from "@/lib/product/types";

export function listBackofficeProducts() {
  return authenticatedApiRequest<ProductSummary[]>("/backoffice/products", {
    method: "GET",
  });
}

export function getBackofficeProduct(id: string) {
  return authenticatedApiRequest<ProductDetail>(`/backoffice/products/${id}`, {
    method: "GET",
  });
}

export function createBackofficeProduct(payload: CreateProductPayload) {
  return authenticatedApiRequest<ProductSummary>("/backoffice/products", {
    body: payload,
    method: "POST",
  });
}

export function updateBackofficeProduct(id: string, payload: UpdateProductPayload) {
  return authenticatedApiRequest<ProductSummary>(`/backoffice/products/${id}`, {
    body: payload,
    method: "PATCH",
  });
}

export function deleteBackofficeProduct(id: string) {
  return authenticatedApiRequest<ProductSummary>(`/backoffice/products/${id}`, {
    method: "DELETE",
  });
}
