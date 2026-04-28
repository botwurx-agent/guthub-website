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

const h2: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400,
  lineHeight: 1.25, letterSpacing: '-0.01em',
  color: 'var(--ink-900)', marginTop: 40, marginBottom: 14,
};

const p: React.CSSProperties = { margin: '0 0 16px' };
const ul: React.CSSProperties = { margin: '0 0 18px', paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 };
const emailLink: React.CSSProperties = { color: 'var(--terracotta-600)', textDecoration: 'none', fontWeight: 600 };

export default function TermsPage() {
  return (
    <>
      <Header />
      <main>
        <ContentPage
          eyebrow="Legal"
          title="Terms of Service"
          lastUpdated="April 28, 2026"
          disclaimer={<>This document is provided for informational purposes. For specific legal questions, please contact us at <a href="mailto:support@guthub.ai" style={emailLink}>support@guthub.ai</a>.</>}
        >
          <h2 style={h2}>Acceptance of terms</h2>
          <p style={p}>By creating an account or using Guthub (&ldquo;the Service&rdquo;), you agree to these Terms of Service. If you do not agree, do not use the Service. These terms form a binding agreement between you and Guthub.</p>

          <h2 style={h2}>Eligibility</h2>
          <p style={p}>You must be at least 18 years old to use Guthub. By using the Service, you confirm you meet this requirement and have the legal capacity to enter into this agreement.</p>

          <h2 style={h2}>Account responsibilities</h2>
          <p style={p}>You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. Notify us immediately if you suspect unauthorized access. Provide accurate information during signup and keep it current.</p>

          <h2 style={h2}>The service</h2>
          <p style={p}>Guthub provides AI-powered nutrition guidance, meal planning, food logging, and related tools. The Service is designed to support your gut health and nutrition decisions, not replace professional medical care. See our Medical Disclaimer for details.</p>
          <p style={p}>We may modify, suspend, or discontinue any part of the Service at any time. We will give reasonable notice of significant changes that affect paid users.</p>

          <h2 style={h2}>Acceptable use</h2>
          <p style={p}>You agree not to:</p>
          <ul style={ul}>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to access accounts, systems, or data not belonging to you</li>
            <li>Reverse engineer, scrape, or copy the Service or its content</li>
            <li>Use the Service to harm yourself or others</li>
            <li>Misrepresent your identity or affiliation</li>
            <li>Interfere with the operation of the Service</li>
            <li>Use automated systems (bots, scrapers) without written permission</li>
          </ul>
          <p style={p}>We may suspend or terminate accounts that violate these rules.</p>

          <h2 style={h2}>Subscriptions and payments</h2>
          <p style={p}>Guthub is offered as a subscription service. Pricing, billing cycles, and trial terms are described on our pricing page.</p>
          <p style={p}><strong>Free trial:</strong> New accounts may receive a free trial period. Credit card information is required to start a trial. If you do not cancel before the trial ends, your subscription begins automatically and your card will be charged.</p>
          <p style={p}><strong>Auto-renewal:</strong> Subscriptions renew automatically at the end of each billing period until you cancel. You can cancel anytime in two taps from your account settings.</p>
          <p style={p}><strong>Refunds:</strong> We do not offer refunds for partial billing periods. If you cancel mid-cycle, you keep access until the end of the current period. Annual plans are non-refundable except where required by law.</p>
          <p style={p}><strong>Founding member pricing:</strong> If you joined as a founding member at locked-in pricing, your rate is preserved as long as your subscription remains continuously active. If you cancel, you may not be able to rejoin at the founding rate.</p>
          <p style={p}><strong>Price changes:</strong> We may change prices for new subscribers at any time. Existing subscribers will be notified at least 30 days before any price increase affecting them. Founding members are exempt from price increases.</p>

          <h2 style={h2}>Intellectual property</h2>
          <p style={p}>Guthub and its content (including software, design, text, graphics, AI-generated outputs, and trademarks) are owned by us or our licensors. You may use the Service for personal, non-commercial purposes only. You may not reproduce, distribute, or create derivative works without permission.</p>
          <p style={p}>You retain ownership of the content you submit to Guthub (intake responses, meal logs, photos, conversations). You grant us a limited license to use this content to provide and improve the Service.</p>

          <h2 style={h2}>AI-generated content</h2>
          <p style={p}>Guthub uses artificial intelligence to generate nutrition guidance, meal plans, and other personalized content. AI outputs are based on the information you provide and may not always be accurate, complete, or appropriate for your specific situation. Use AI-generated guidance with judgment and consult qualified professionals for medical, dietary, or health decisions that matter.</p>

          <h2 style={h2}>Disclaimers</h2>
          <p style={p}>Guthub is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee that the Service will be uninterrupted, error-free, or that any specific health outcomes will result from its use.</p>
          <p style={p}>Guthub is not a medical service. We do not diagnose, treat, cure, or prevent any disease or condition. The Service is not a substitute for professional medical advice, diagnosis, or treatment. See our Medical Disclaimer.</p>

          <h2 style={h2}>Limitation of liability</h2>
          <p style={p}>To the maximum extent permitted by law, Guthub and its affiliates are not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability for any claim is limited to the amount you paid us in the 12 months preceding the claim.</p>
          <p style={p}>This limitation applies even if we have been advised of the possibility of such damages and even if a remedy fails its essential purpose.</p>

          <h2 style={h2}>Indemnification</h2>
          <p style={p}>You agree to indemnify and hold harmless Guthub and its affiliates from any claims, damages, or expenses arising from your use of the Service, your violation of these Terms, or your violation of any third party&rsquo;s rights.</p>

          <h2 style={h2}>Termination</h2>
          <p style={p}>You can stop using the Service and cancel your account anytime. We can suspend or terminate your account if you violate these Terms or for other legitimate business reasons. Upon termination, your right to use the Service ends, but provisions relating to liability, indemnification, and intellectual property survive.</p>

          <h2 style={h2}>Governing law and disputes</h2>
          <p style={p}>These Terms are governed by the laws of Los Angeles, California. Any disputes will be resolved in the courts of California unless you are a consumer entitled to bring claims in your local courts.</p>
          <p style={p}>We encourage you to contact us first to resolve any concerns informally.</p>

          <h2 style={h2}>Changes to these terms</h2>
          <p style={p}>We may update these Terms as the Service evolves. We will notify you of material changes. Continued use of the Service after changes take effect means you accept the updated Terms.</p>

          <h2 style={h2}>Contact</h2>
          <p style={p}>For questions about these Terms, contact us at:</p>
          <p style={p}><a href="mailto:support@guthub.ai" style={emailLink}>support@guthub.ai</a></p>
        </ContentPage>
        <FinalCTA />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
