export type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  logoPublicId: string | null;
  bannerUrl: string | null;
  bannerPublicId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateBrandPayload = {
  name: string;
  slug: string;
  logoUrl?: string;
  bannerUrl?: string;
  active?: boolean;
};

export type UpdateBrandPayload = Partial<CreateBrandPayload>;
