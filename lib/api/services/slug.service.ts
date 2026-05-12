import { ApiError, apiRequest } from "@/lib/api/client";

type GenerateSlugPayload = {
  text: string;
};

type GenerateSlugResponse = {
  slug: string;
};

export function generateSlug(payload: GenerateSlugPayload) {
  return requestSlugWithFallback(payload);
}

const SLUG_ENDPOINT_CANDIDATES = ["/slug", "/catalog/slug", "/utils/slug"] as const;

async function requestSlugWithFallback(payload: GenerateSlugPayload) {
  let lastNotFoundError: ApiError | null = null;

  for (const path of SLUG_ENDPOINT_CANDIDATES) {
    try {
      return await apiRequest<GenerateSlugResponse>(path, {
        body: payload,
        method: "POST",
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        lastNotFoundError = error;
        continue;
      }

      throw error;
    }
  }

  throw new ApiError(
    "Không tìm thấy API tạo slug. Vui lòng kiểm tra route backend cho chức năng này.",
    404,
    lastNotFoundError?.url ?? "/slug",
    lastNotFoundError?.details ?? "",
  );
}
