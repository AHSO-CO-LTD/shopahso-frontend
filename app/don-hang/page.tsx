import { redirect } from "next/navigation";

export const metadata = {
  title: "Đơn hàng của tôi | ShopAHSO",
};

export default function OrdersRoute() {
  redirect("/tai-khoan/don-hang");
}
