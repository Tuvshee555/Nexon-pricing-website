import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import OperationsSection from "@/components/landing/OperationsSection";
import PricingSection from "@/components/landing/PricingSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import TemplatesSection from "@/components/landing/TemplatesSection";
import TeamSection from "@/components/landing/TeamSection";
import ContactSection from "@/components/landing/ContactSection";
import ScrollProgress from "@/components/ui/ScrollProgress";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />
      <main>
        <HeroSection />
        <SocialProofSection />
        <FeaturesSection />
        <OperationsSection />
        <TemplatesSection />
        <PricingSection />
        <HowItWorksSection />
        <TeamSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
