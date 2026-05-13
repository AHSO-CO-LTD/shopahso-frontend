import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type {
  CreateProductAttributePayload,
  ProductAttributeDefinition,
  UpdateProductAttributePayload,
} from "@/lib/product/types";

export function createProductAttribute(
  productId: string,
  payload: CreateProductAttributePayload,
) {
  return authenticatedApiRequest<ProductAttributeDefinition>(
    `/backoffice/products/${productId}/attributes`,
    {
      body: payload,
      method: "POST",
    },
  );
}

export function listProductAttributes(productId: string) {
  return authenticatedApiRequest<ProductAttributeDefinition[]>(
    `/backoffice/products/${productId}/attributes`,
    {
      method: "GET",
    },
  );
}

export function updateProductAttribute(
  id: string,
  payload: UpdateProductAttributePayload,
) {
  return authenticatedApiRequest<ProductAttributeDefinition>(
    `/backoffice/product-attributes/${id}`,
    {
      body: payload,
      method: "PATCH",
    },
  );
}

export function deleteProductAttribute(id: string) {
  return authenticatedApiRequest<ProductAttributeDefinition>(
    `/backoffice/product-attributes/${id}`,
    {
      method: "DELETE",
    },
  );
}
