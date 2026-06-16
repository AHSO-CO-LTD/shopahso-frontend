import Hero from "@/components/home/Hero";
import HomeBanner from "@/components/home/HomeBanner";
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
      {/* Section 2: Admin-managed banner images */}
      <HomeBanner />
      {/* Section 3: Promotions (auto-hides when empty) */}
      <HomePromotionStrip />
      {/* Section 4: Category navigation */}
      <HomeCategoryNav />
      {/* Section 5: Featured brands */}
      <HomePartnerBrands />
      {/* Section 6+7: Featured products + New arrivals */}
      <HomeMerchandiseSections />
      {/* Section 8: Trust / B2B support */}
      <ValueProps />
    </div>
  );
}
