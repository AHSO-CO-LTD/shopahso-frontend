export type BannerPlacement = "HOMEPAGE" | "PROMOTION" | "FLOATING";

export type Banner = {
  id: string;
  placement: BannerPlacement;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  linkUrl?: string | null;
  active: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateBannerPayload = {
  placement: BannerPlacement;
  imageUrl?: string;
  linkUrl?: string;
  active?: boolean;
  sortOrder?: number;
};

export type UpdateBannerPayload = Partial<CreateBannerPayload>;
