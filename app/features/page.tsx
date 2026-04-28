import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import FinalCTA from '@/components/FinalCTA';
import FeaturesHero from '@/components/features/FeaturesHero';
import OnboardingFlowAnimation from '@/components/features/OnboardingFlowAnimation';
import FeatureBlocks from '@/components/features/FeatureBlocks';
import CrossPlatformShowcase from '@/components/features/CrossPlatformShowcase';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features — GutHub',
  description: 'Everything you need, all connected. Snap & know, AI chat, goal tracker, meal planner, test reports, and health dashboard.',
};

export default function FeaturesPage() {
  return (
    <>
      <Header />
      <main>
        <FeaturesHero />
        <OnboardingFlowAnimation />
        <FeatureBlocks />
        <CrossPlatformShowcase />
        <FinalCTA />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
