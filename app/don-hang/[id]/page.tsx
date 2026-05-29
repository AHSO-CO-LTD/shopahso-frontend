import { redirect } from "next/navigation";

export const metadata = {
  title: "Chi tiết đơn hàng | ShopAHSO",
};

export default async function OrderDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/tai-khoan/don-hang/${id}`);
}
