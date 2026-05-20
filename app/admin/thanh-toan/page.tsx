import AdminLayout from "@/components/admin/AdminLayout";
import { PaymentSettingManager } from "@/components/backoffice/payment/PaymentSettingManager";

export default function AdminPaymentSettingsPage() {
  return (
    <AdminLayout>
      <PaymentSettingManager surface="admin" />
    </AdminLayout>
  );
}
