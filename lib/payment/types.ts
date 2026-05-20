export type PaymentSetting = {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrTemplate: string;
  transferContentTemplate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaymentSettingPayload = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrTemplate?: string;
  transferContentTemplate?: string;
  active?: boolean;
};

export type TestVietQrPayload = {
  amount: string;
  note: string;
};

export type VietQrPaymentPreview = {
  paymentProvider: "VIETQR";
  paymentBankCode: string;
  paymentBankName: string;
  paymentBankAccountNumber: string;
  paymentBankAccountName: string;
  paymentTransferContent: string;
  paymentQrUrl: string;
};

export type VietQrBank = {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo?: string;
  transferSupported?: number;
  lookupSupported?: number;
  short_name?: string;
  support?: number;
  isTransfer?: number;
  swift_code?: string;
};

export type VietQrBanksResponse = {
  code: string;
  desc: string;
  data: VietQrBank[];
};
