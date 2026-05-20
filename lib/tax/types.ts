export type TaxScope = "GLOBAL" | "CATEGORY" | "PRODUCT" | "VARIANT";

export type TaxSettingTarget = {
  id: string;
  name: string;
  slug: string;
};

export type TaxSetting = {
  id: string;
  scope: TaxScope;
  targetId: string | null;
  target: TaxSettingTarget | null;
  taxPercent: string;
  createdAt: string;
  updatedAt: string;
};

export type UpsertTaxSettingPayload = {
  scope: TaxScope;
  targetId?: string | null;
  taxPercent: number;
};

export type DeleteTaxSettingPayload = {
  scope: TaxScope;
  targetId?: string | null;
};
