import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import FinalCTA from '@/components/FinalCTA';
import PricingContent from '@/components/pricing/PricingContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — GutHub',
  description: 'Try it free for 7 days. $9.95/month for founding members. Cancel anytime.',
};

export default function PricingPage() {
  return (
    <>
      <Header />
      <main>
        <PricingContent />
        <FinalCTA />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
