import Link from "next/link";
import { ArrowRight, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomeThanks() {
  return (
    <section className="bg-foreground text-background">
      <div className="container mx-auto grid gap-6 px-4 py-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 border border-background/20 px-3 py-2">
            <HeartHandshake className="size-4 text-secondary" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-background/70">
              Thank you
            </span>
          </div>
          <h2 className="max-w-3xl text-2xl font-black tracking-tight sm:text-3xl">
            Cảm ơn bạn đã tin ShopAHSO cho nhu cầu vật tư công nghiệp.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-background/70">
            
          </p>
        </div>

        <Button
          asChild
          className="h-11 w-fit rounded-none bg-background px-5 font-black text-foreground hover:bg-background/90"
          size="lg"
        >
          <Link href="/san-pham">
            Tiếp tục mua hàng
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
