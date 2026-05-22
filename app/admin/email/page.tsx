import AdminLayout from "@/components/admin/AdminLayout";
import { MailSettingManager } from "@/components/backoffice/mail/MailSettingManager";

export default function AdminMailSettingsPage() {
  return (
    <AdminLayout>
      <MailSettingManager />
    </AdminLayout>
  );
}
