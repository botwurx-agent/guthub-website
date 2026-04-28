import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import FinalCTA from '@/components/FinalCTA';
import ContactForm from '@/components/ContactForm';
import { Eyebrow, Reveal } from '@/components/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — GutHub',
  description: 'Get in touch with the GutHub team.',
};

const emailLink: React.CSSProperties = { color: 'var(--terracotta-600)', textDecoration: 'none', fontWeight: 600 };

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <section className="section-pad" style={{ padding: '88px 32px 96px', background: 'var(--cream-50)' }}>
          <div style={{ maxWidth: 'var(--maxw-page)', margin: '0 auto' }}>
            <div className="contact-grid" style={{
              display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: 64, alignItems: 'start',
            }}>
              <Reveal>
                <Eyebrow>Contact</Eyebrow>
                <h1 className="h1-mobile" style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)',
                  lineHeight: 1.18, letterSpacing: '-0.025em', fontWeight: 400,
                  marginTop: 18, marginBottom: 20, color: 'var(--ink-900)',
                }}>
                  Get in <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>touch.</em>
                </h1>
                <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--ink-700)', marginBottom: 28 }}>
                  We read every message. Whether you have a question about the product, feedback, a media inquiry, or a privacy concern, we&rsquo;d love to hear from you.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 15, color: 'var(--ink-800)', lineHeight: 1.5 }}>
                  <ContactRow label="For general questions">
                    <a href="mailto:support@guthub.ai" style={emailLink}>support@guthub.ai</a>
                  </ContactRow>
                  <ContactRow label="For privacy and data requests">
                    <a href="mailto:support@guthub.ai" style={emailLink}>support@guthub.ai</a>
                  </ContactRow>
                  <ContactRow label="For press inquiries">
                    <a href="mailto:support@guthub.ai" style={emailLink}>support@guthub.ai</a>
                  </ContactRow>
                </div>
                <p style={{ marginTop: 28, fontSize: 14, color: 'var(--ink-500)' }}>
                  We aim to respond within 1&ndash;2 business days.
                </p>
              </Reveal>

              <Reveal delay={120} y={20}>
                <ContactForm />
              </Reveal>
            </div>
          </div>
        </section>
        <FinalCTA />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}

function ContactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 2 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}
