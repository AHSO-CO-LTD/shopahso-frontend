import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import { apiRequest } from "@/lib/api/client";
import type {
  BackofficeCategory,
  CategoryTreeNode,
  CreateBackofficeCategoryPayload,
  UpdateBackofficeCategoryPayload,
} from "@/lib/category/types";

export function listCatalogCategoryTree() {
  return apiRequest<CategoryTreeNode[]>("/catalog/categories/tree", {
    method: "GET",
  });
}

export function listBackofficeCategories(query?: { q?: string }) {
  return authenticatedApiRequest<BackofficeCategory[]>("/backoffice/categories", {
    method: "GET",
    query,
  });
}

export function createBackofficeCategory(payload: CreateBackofficeCategoryPayload) {
  return authenticatedApiRequest<BackofficeCategory>("/backoffice/categories", {
    body: payload,
    method: "POST",
  });
}

export function updateBackofficeCategory(id: string, payload: UpdateBackofficeCategoryPayload) {
  return authenticatedApiRequest<BackofficeCategory>(`/backoffice/categories/${id}`, {
    body: payload,
    method: "PATCH",
  });
}

export function deleteBackofficeCategory(id: string) {
  return authenticatedApiRequest<BackofficeCategory>(`/backoffice/categories/${id}`, {
    method: "DELETE",
  });
}
