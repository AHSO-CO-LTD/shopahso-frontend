export type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateBrandPayload = {
  name: string;
  slug: string;
  logoUrl?: string;
  active?: boolean;
};

export type UpdateBrandPayload = Partial<CreateBrandPayload>;
