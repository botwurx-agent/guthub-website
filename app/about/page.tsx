import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import FinalCTA from '@/components/FinalCTA';
import AboutHero from '@/components/about/AboutHero';
import FounderStory from '@/components/about/FounderStory';
import WhyGuthub from '@/components/about/WhyGuthub';
import Beliefs from '@/components/about/Beliefs';
import NotThat from '@/components/about/NotThat';
import LeadAdvisor from '@/components/about/LeadAdvisor';
import WhatsNext from '@/components/about/WhatsNext';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | GutHub',
  description: 'Built by someone who needed it himself. Learn the story behind GutHub and meet the team.',
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        <AboutHero />
        <FounderStory />
        <WhyGuthub />
        <Beliefs />
        <NotThat />
        <LeadAdvisor />
        <WhatsNext />
        <FinalCTA />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
