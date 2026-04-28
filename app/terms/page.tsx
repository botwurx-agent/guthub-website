import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import FinalCTA from '@/components/FinalCTA';
import ContentPage from '@/components/ContentPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — GutHub',
  description: 'GutHub Terms of Service.',
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main>
        <ContentPage
          eyebrow="Legal"
          title="Terms of Service"
          lastUpdated="April 28, 2026"
          disclaimer="This document is provided for informational purposes. For specific legal questions, please contact us at [contact email]."
        >
          <p>This Terms of Service document is being finalized in collaboration with legal counsel. The full agreement governing your use of GutHub will be published here ahead of public launch.</p>
          <p>If you have specific questions in the meantime, please reach out at [contact email].</p>
        </ContentPage>
        <FinalCTA />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
