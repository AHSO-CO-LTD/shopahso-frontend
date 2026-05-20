import AdminLayout from "@/components/admin/AdminLayout";
import { TaxSettingManager } from "@/components/backoffice/tax/TaxSettingManager";

export default function AdminTaxSettingsPage() {
  return (
    <AdminLayout>
      <TaxSettingManager surface="admin" />
    </AdminLayout>
  );
}
