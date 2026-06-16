import HomeBanner from "@/components/home/HomeBanner";
import HomeCategoryNav from "@/components/home/HomeCategoryNav";
import HomeMerchandiseSections from "@/components/home/HomeMerchandiseSections";
import HomePartnerBrands from "@/components/home/HomePartnerBrands";
import HomePromotionStrip from "@/components/home/HomePromotionStrip";
import ValueProps from "@/components/home/ValueProps";

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">
      <HomeBanner />
      <HomePromotionStrip />
      <HomeCategoryNav />
      <HomePartnerBrands />
      <HomeMerchandiseSections />
      <ValueProps />
    </div>
  );
}
