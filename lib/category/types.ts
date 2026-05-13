export type CategoryTreeNode = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  children: CategoryTreeNode[];
};

export type CategoryParentSummary = {
  id: string;
  name: string;
  slug: string;
};

export type BackofficeCategory = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  parent: CategoryParentSummary | null;
};

export type CreateBackofficeCategoryPayload = {
  parentId?: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  sortOrder: number;
};

export type UpdateBackofficeCategoryPayload = Partial<CreateBackofficeCategoryPayload>;
