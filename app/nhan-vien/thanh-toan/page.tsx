import { PaymentSettingManager } from "@/components/backoffice/payment/PaymentSettingManager";
import StaffLayout from "@/components/staff/StaffLayout";

export default function StaffPaymentSettingsPage() {
  return (
    <StaffLayout>
      <PaymentSettingManager surface="staff" />
    </StaffLayout>
  );
}
