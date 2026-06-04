import HomeBanner from "@/components/home/HomeBanner";
import HomeBuyingProcess from "@/components/home/HomeBuyingProcess";
import HomeMerchandiseSections from "@/components/home/HomeMerchandiseSections";
import HomePartnerBrands from "@/components/home/HomePartnerBrands";
import HomePromotionStrip from "@/components/home/HomePromotionStrip";
import HomeThanks from "@/components/home/HomeThanks";

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">
      <HomeBanner />
      <HomePromotionStrip />
      <HomeMerchandiseSections />
      <HomePartnerBrands />
      <HomeBuyingProcess />
      <HomeThanks />
    </div>
  );
}
