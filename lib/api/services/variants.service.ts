import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type { PricingStatus } from "@/lib/pricing-status";
import type {
  CreateVariantPayload,
  UpdateVariantPayload,
  VariantSummary,
} from "@/lib/product/types";

export type VariantImportPreviewError = {
  rowNumber: number;
  field: string;
  message: string;
};

export type VariantImportPreviewRow = {
  rowNumber: number;
  no?: string;
  variantName: string;
  sku: string;
  slug: string;
  price: string;
  costPrice: string;
  pricingStatus: PricingStatus;
  originCountryCode?: string | null;
  originCountryName?: string | null;
  stockQuantity: number;
  unit: string;
};

export type VariantImportPreviewResponse = {
  productId: string;
  headers: string[];
  attributeColumns: string[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: VariantImportPreviewError[];
  rows: VariantImportPreviewRow[];
};

export type VariantImportCommitItem = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  pricingStatus: PricingStatus;
};

export type VariantImportCommitResponse = {
  productId: string;
  totalRows: number;
  createdCount: number;
  createdVariants: VariantImportCommitItem[];
};

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

export function uploadBackofficeVariantImage(id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return authenticatedApiRequest<VariantSummary>(`/backoffice/variants/${id}/images`, {
    body: formData,
    method: "POST",
  });
}

export function deleteBackofficeVariantImage(id: string, publicId: string) {
  return authenticatedApiRequest<VariantSummary>(`/backoffice/variants/${id}/images`, {
    body: { publicId },
    method: "DELETE",
  });
}

export function downloadBackofficeVariantImportTemplate(productId: string) {
  return authenticatedApiRequest<Blob>(`/backoffice/products/${productId}/variants/import/template.csv`, {
    method: "GET",
    responseType: "blob",
  });
}

export function previewBackofficeVariantImport(productId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return authenticatedApiRequest<VariantImportPreviewResponse>(`/backoffice/products/${productId}/variants/import/preview`, {
    body: formData,
    method: "POST",
  });
}

export function commitBackofficeVariantImport(productId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return authenticatedApiRequest<VariantImportCommitResponse>(`/backoffice/products/${productId}/variants/import/commit`, {
    body: formData,
    method: "POST",
  });
}
