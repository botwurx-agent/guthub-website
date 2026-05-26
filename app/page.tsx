import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import Hero from '@/components/home/Hero';
import ProblemSection from '@/components/home/ProblemSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import HowItWorks from '@/components/home/HowItWorks';
import LoggingEngineSection from '@/components/home/LoggingEngineSection';
import Testimonials from '@/components/home/Testimonials';
import Pricing from '@/components/home/Pricing';
import FAQ from '@/components/home/FAQ';
import FinalCTA from '@/components/FinalCTA';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorks />
        <LoggingEngineSection />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
