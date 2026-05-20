import { TaxSettingManager } from "@/components/backoffice/tax/TaxSettingManager";
import StaffLayout from "@/components/staff/StaffLayout";

export default function StaffTaxSettingsPage() {
  return (
    <StaffLayout>
      <TaxSettingManager surface="staff" />
    </StaffLayout>
  );
}
