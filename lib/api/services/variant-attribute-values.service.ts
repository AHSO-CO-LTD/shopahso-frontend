import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type {
  UpsertVariantAttributeValuesPayload,
  VariantAttributeValue,
} from "@/lib/product/types";

export function listVariantAttributeValues(variantId: string) {
  return authenticatedApiRequest<VariantAttributeValue[]>(
    `/backoffice/variants/${variantId}/attribute-values`,
    {
      method: "GET",
    },
  );
}

export function upsertVariantAttributeValues(
  variantId: string,
  payload: UpsertVariantAttributeValuesPayload,
) {
  return authenticatedApiRequest<VariantAttributeValue[]>(
    `/backoffice/variants/${variantId}/attribute-values`,
    {
      body: payload,
      method: "PUT",
    },
  );
}
