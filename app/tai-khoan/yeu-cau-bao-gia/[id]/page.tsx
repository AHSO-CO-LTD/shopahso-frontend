import UserQuoteRequestDetailPage from "@/components/quote-requests/UserQuoteRequestDetailPage";

export const metadata = {
  title: "Chi tiết yêu cầu báo giá | ShopAHSO",
};

export default async function MyQuoteRequestDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <UserQuoteRequestDetailPage requestId={id} />;
}
