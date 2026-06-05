import { notFound } from "next/navigation";
import AdminAlertDetailPage from "@/components/admin/alerts/AdminAlertDetailPage";
import { getAdminAlertDestination } from "@/components/admin/alerts/admin-alert-destinations";

type AdminAlertPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AdminAlertPage({ params }: AdminAlertPageProps) {
  const { slug } = await params;
  const destination = getAdminAlertDestination(slug);

  if (!destination) {
    notFound();
  }

  return <AdminAlertDetailPage destination={destination} />;
}
