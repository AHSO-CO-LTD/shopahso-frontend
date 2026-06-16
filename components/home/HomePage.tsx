import Hero from "@/components/home/Hero";
import HomeCategoryNav from "@/components/home/HomeCategoryNav";
import HomeMerchandiseSections from "@/components/home/HomeMerchandiseSections";
import HomePartnerBrands from "@/components/home/HomePartnerBrands";
import HomePromotionStrip from "@/components/home/HomePromotionStrip";
import ValueProps from "@/components/home/ValueProps";

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">
      {/* Section 1: Hero + Search */}
      <Hero />
      {/* Section 2: Promotions (auto-hides when empty) */}
      <HomePromotionStrip />
      {/* Section 3: Category navigation */}
      <HomeCategoryNav />
      {/* Section 4: Featured brands */}
      <HomePartnerBrands />
      {/* Section 5+6: Featured products + New arrivals */}
      <HomeMerchandiseSections />
      {/* Section 7: Trust / B2B support */}
      <ValueProps />
    </div>
  );
}
