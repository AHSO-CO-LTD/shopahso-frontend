import { apiRequest } from "@/lib/api/client";
import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type { Brand, CreateBrandPayload, UpdateBrandPayload } from "@/lib/brand/types";

const BRAND_MEDIA_UPLOAD_TIMEOUT_MS = 60_000;

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

export function uploadBackofficeBrandLogo(id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return authenticatedApiRequest<Brand>(`/backoffice/brands/${id}/logo`, {
    body: formData,
    method: "POST",
    timeoutMs: BRAND_MEDIA_UPLOAD_TIMEOUT_MS,
  });
}

export function uploadBackofficeBrandBanner(id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return authenticatedApiRequest<Brand>(`/backoffice/brands/${id}/banner`, {
    body: formData,
    method: "POST",
    timeoutMs: BRAND_MEDIA_UPLOAD_TIMEOUT_MS,
  });
}
