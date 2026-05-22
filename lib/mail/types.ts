export type MailSettings = {
  id: string;
  adminOrderRecipients: string[];
  notifyRegistrationCustomer: boolean;
  notifyOrderCreatedCustomer: boolean;
  notifyOrderStatusCustomer: boolean;
  notifyOrderCreatedAdmin: boolean;
  notifyOrderCompletedAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MailSettingsPayload = {
  adminOrderRecipients?: string[];
  notifyRegistrationCustomer?: boolean;
  notifyOrderCreatedCustomer?: boolean;
  notifyOrderStatusCustomer?: boolean;
  notifyOrderCreatedAdmin?: boolean;
  notifyOrderCompletedAdmin?: boolean;
};

export type TestMailSettingsPayload = {
  email: string;
};

export type TestMailSettingsResponse = {
  sent: boolean;
};
