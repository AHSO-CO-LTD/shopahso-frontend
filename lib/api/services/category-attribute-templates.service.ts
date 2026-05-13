import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type {
  CategoryAttributeTemplate,
  CreateCategoryAttributeTemplatePayload,
  UpdateCategoryAttributeTemplatePayload,
} from "@/lib/product/types";

export function createCategoryAttributeTemplate(
  categoryId: string,
  payload: CreateCategoryAttributeTemplatePayload,
) {
  return authenticatedApiRequest<CategoryAttributeTemplate>(
    `/backoffice/categories/${categoryId}/attribute-templates`,
    {
      body: payload,
      method: "POST",
    },
  );
}

export function listCategoryAttributeTemplates(categoryId: string) {
  return authenticatedApiRequest<CategoryAttributeTemplate[]>(
    `/backoffice/categories/${categoryId}/attribute-templates`,
    {
      method: "GET",
    },
  );
}

export function updateCategoryAttributeTemplate(
  id: string,
  payload: UpdateCategoryAttributeTemplatePayload,
) {
  return authenticatedApiRequest<CategoryAttributeTemplate>(
    `/backoffice/category-attribute-templates/${id}`,
    {
      body: payload,
      method: "PATCH",
    },
  );
}

export function deleteCategoryAttributeTemplate(id: string) {
  return authenticatedApiRequest<CategoryAttributeTemplate>(
    `/backoffice/category-attribute-templates/${id}`,
    {
      method: "DELETE",
    },
  );
}
