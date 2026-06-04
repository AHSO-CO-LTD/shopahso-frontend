import { apiRequest } from "@/lib/api/client";
import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type {
  Banner,
  BannerPlacement,
  CreateBannerPayload,
  UpdateBannerPayload,
} from "@/lib/banner/types";

type BackofficeBannerQuery = {
  active?: boolean | "";
  placement?: BannerPlacement | "";
};

export function listBackofficeBanners(query: BackofficeBannerQuery = {}) {
  return authenticatedApiRequest<Banner[]>("/backoffice/banners", {
    method: "GET",
    query,
  });
}

export function getBackofficeBanner(id: string) {
  return authenticatedApiRequest<Banner>(`/backoffice/banners/${id}`, {
    method: "GET",
  });
}

export function createBackofficeBanner(payload: CreateBannerPayload) {
  return authenticatedApiRequest<Banner>("/backoffice/banners", {
    body: payload,
    method: "POST",
  });
}

export function updateBackofficeBanner(id: string, payload: UpdateBannerPayload) {
  return authenticatedApiRequest<Banner>(`/backoffice/banners/${id}`, {
    body: payload,
    method: "PATCH",
  });
}

export function uploadBackofficeBannerImage(id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return authenticatedApiRequest<Banner>(`/backoffice/banners/${id}/image`, {
    body: formData,
    method: "POST",
  });
}

export function deleteBackofficeBanner(id: string) {
  return authenticatedApiRequest<{ deleted: boolean }>(`/backoffice/banners/${id}`, {
    method: "DELETE",
  });
}

export function listPublicBanners(placement?: BannerPlacement) {
  return apiRequest<Banner[]>("/banners", {
    method: "GET",
    query: { placement },
  });
}
