import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import FinalCTA from '@/components/FinalCTA';
import ContentPage from '@/components/ContentPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy — GutHub',
  description: 'GutHub Cookie Policy.',
};

export default function CookiesPage() {
  return (
    <>
      <Header />
      <main>
        <ContentPage
          eyebrow="Legal"
          title="Cookie Policy"
          lastUpdated="April 28, 2026"
          disclaimer="This document is provided for informational purposes. For specific legal questions, please contact us at [contact email]."
        >
          <p>This Cookie Policy is being finalized in collaboration with legal counsel. The full description of the cookies and similar technologies GutHub uses, and how you can manage them, will be published here ahead of public launch.</p>
          <p>If you have specific questions in the meantime, please reach out at [contact email].</p>
        </ContentPage>
        <FinalCTA />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
