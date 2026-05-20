export type UserAddress = {
  id: string;
  userId: string;
  label: string;
  name: string;
  phoneNumber: string | null;
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  streetAddress: string;
  note: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserAddressPayload = {
  label: string;
  name: string;
  phoneNumber?: string;
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  streetAddress: string;
  note?: string;
  status?: boolean;
};

export type UpdateUserAddressPayload = Partial<CreateUserAddressPayload>;

export type DeleteUserAddressResponse = {
  deleted: boolean;
};
