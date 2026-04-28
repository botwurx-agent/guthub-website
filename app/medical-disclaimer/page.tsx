import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import FinalCTA from '@/components/FinalCTA';
import ContentPage from '@/components/ContentPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Medical Disclaimer — GutHub',
  description: 'GutHub Medical Disclaimer.',
};

export default function MedicalDisclaimerPage() {
  return (
    <>
      <Header />
      <main>
        <ContentPage
          eyebrow="Legal"
          title="Medical Disclaimer"
          lastUpdated="April 28, 2026"
          disclaimer={<>This document is provided for informational purposes. For specific legal questions, please contact us at <a href="mailto:support@guthub.ai" style={{ color: 'var(--terracotta-600)', textDecoration: 'none', fontWeight: 600 }}>support@guthub.ai</a>.</>}
        >
          <p>This Medical Disclaimer is being finalized in collaboration with legal and clinical advisors. The full statement of GutHub's role in your care — and what it is not — will be published here ahead of public launch.</p>
          <p>GutHub is designed to complement professional care, not replace it. Always consult a qualified clinician for diagnoses, prescriptions, and treatment decisions.</p>
          <p>If you have specific questions in the meantime, please reach out at <a href="mailto:support@guthub.ai" style={{ color: 'var(--terracotta-600)', textDecoration: 'none', fontWeight: 600 }}>support@guthub.ai</a>.</p>
        </ContentPage>
        <FinalCTA />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
