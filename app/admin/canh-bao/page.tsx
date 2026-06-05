import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { adminAlertDestinations } from "@/components/admin/alerts/admin-alert-destinations";

export default function AdminAlertsIndexPage() {
  const destinations = Object.values(adminAlertDestinations);

  return (
    <AdminLayout>
      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Cảnh báo quản trị
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Các trang xử lý cảnh báo</h1>
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          {destinations.map((destination) => (
            <article key={destination.slug} className="border border-border bg-background px-5 py-5">
              <h2 className="text-base font-black tracking-tight">{destination.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{destination.description}</p>
              <Button asChild className="mt-4 h-10 cursor-pointer rounded-none px-4" variant="outline">
                <Link href={`/admin/canh-bao/${destination.slug}`}>Mở trang xử lý</Link>
              </Button>
            </article>
          ))}
        </section>
      </main>
    </AdminLayout>
  );
}
