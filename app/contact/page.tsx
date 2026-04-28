import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import FinalCTA from '@/components/FinalCTA';
import ContentPage from '@/components/ContentPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — GutHub',
  description: 'How to reach the GutHub team.',
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <ContentPage
          eyebrow="Contact"
          title={<>How to <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>reach us.</em></>}
          lastUpdated="April 28, 2026"
        >
          <p>For general questions, support, or feedback, email us at [contact email]. We aim to respond within two business days.</p>
          <p>For press, partnerships, or other business inquiries, please use the same address and include a subject line that describes the topic.</p>
        </ContentPage>
        <FinalCTA />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
