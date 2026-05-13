import Hero from "@/components/home/Hero";
import ValueProps from "@/components/home/ValueProps";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import FeaturedBrands from "@/components/home/FeaturedBrands";
import NewArrivals from "@/components/home/NewArrivals";

export const metadata = {
  title: "ShopAHSO — Linh kiện & Vật tư Công nghiệp",
  description:
    "Nền tảng tra cứu và đặt hàng linh kiện công nghiệp: PLC, cảm biến, thiết bị đóng cắt, robot, băng chuyền. Hỗ trợ B2B và B2C với thông tin kỹ thuật minh bạch.",
};

export default function Home() {
  return (
    <>
      {/* 1. Hero — 3D Industrial Scene + CTA */}
      <Hero />

      {/* 2. Value Props — 4 USP columns */}
      <ValueProps />

      {/* 3. Marquee — brand keywords */}
      <section className="overflow-hidden border-y border-border bg-muted py-10">
        <div className="flex animate-infinite-scroll whitespace-nowrap">
          <div className="flex select-none items-center gap-20 px-10 text-xl font-black italic tracking-[0.1em] text-border">
            <span>Precision</span> • <span>Performance</span> • <span>Reliability</span> •{" "}
            <span>Automation</span> • <span>AHSO Industrial</span> • <span>Quality First</span> •{" "}
            <span>Safety Standards</span> • <span>Fast Delivery</span> •
          </div>
          <div className="flex select-none items-center gap-20 px-10 text-xl font-black italic tracking-[0.1em] text-border">
            <span>Precision</span> • <span>Performance</span> • <span>Reliability</span> •{" "}
            <span>Automation</span> • <span>AHSO Industrial</span> • <span>Quality First</span> •{" "}
            <span>Safety Standards</span> • <span>Fast Delivery</span> •
          </div>
        </div>
      </section>

      {/* 4. Featured Products */}
      <FeaturedProducts />

      {/* 5. Featured Brands */}
      <FeaturedBrands />

      {/* 6. New Arrivals */}
      <NewArrivals />

      {/* 7. SKU Search CTA */}
      <section className="border-t border-border bg-primary py-24 text-white">
        <div className="container mx-auto px-4">
          <div className="mb-3 font-mono text-[10px] tracking-[0.25em] text-white/60 uppercase">
            QUICK LOOKUP / SKU SEARCH
          </div>
          <h2 className="mb-4 text-3xl font-black tracking-tight lg:text-5xl">
            Đang tìm mã hàng cụ thể?
          </h2>
          <p className="mb-10 max-w-xl font-medium text-white/75 leading-relaxed">
            Nhập Part Number hoặc SKU để tra Datasheet, giá và tình trạng tồn kho của hơn 1 triệu sản phẩm.
          </p>
          <div className="flex max-w-2xl">
            <input
              type="text"
              placeholder="Nhập mã SKU, Part Number..."
              className="h-14 flex-1 bg-white px-6 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="button"
              className="h-14 cursor-pointer bg-foreground px-10 font-semibold text-white transition-colors hover:bg-black"
            >
              Tra cứu →
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
