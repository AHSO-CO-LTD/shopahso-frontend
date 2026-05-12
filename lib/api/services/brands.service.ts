import { apiRequest } from "@/lib/api/client";
import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type { Brand, CreateBrandPayload, UpdateBrandPayload } from "@/lib/brand/types";

export function listCatalogBrands() {
  return apiRequest<Brand[]>("/catalog/brands", {
    method: "GET",
  });
}

export function listBackofficeBrands() {
  return authenticatedApiRequest<Brand[]>("/backoffice/brands", {
    method: "GET",
  });
}

export function createBackofficeBrand(payload: CreateBrandPayload) {
  return authenticatedApiRequest<Brand>("/backoffice/brands", {
    body: payload,
    method: "POST",
  });
}

export function updateBackofficeBrand(id: string, payload: UpdateBrandPayload) {
  return authenticatedApiRequest<Brand>(`/backoffice/brands/${id}`, {
    body: payload,
    method: "PATCH",
  });
}

export function deleteBackofficeBrand(id: string) {
  return authenticatedApiRequest<Brand>(`/backoffice/brands/${id}`, {
    method: "DELETE",
  });
}
