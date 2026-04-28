import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import FinalCTA from '@/components/FinalCTA';
import ContentPage from '@/components/ContentPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — GutHub',
  description: 'How GutHub collects, uses, stores, and protects your information.',
};

const h2: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400,
  lineHeight: 1.25, letterSpacing: '-0.01em',
  color: 'var(--ink-900)', marginTop: 40, marginBottom: 14,
};

const h3: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 700,
  color: 'var(--ink-900)', marginTop: 24, marginBottom: 10,
};

const p: React.CSSProperties = { margin: '0 0 16px' };

const ul: React.CSSProperties = {
  margin: '0 0 18px', paddingLeft: 22,
  display: 'flex', flexDirection: 'column', gap: 6,
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main>
        <ContentPage
          eyebrow="Legal"
          title="Privacy Policy"
          lastUpdated="April 28, 2026"
          disclaimer={<>This document is provided for informational purposes. For specific legal questions, please contact us at <a href="mailto:support@guthub.ai" style={{ color: 'var(--terracotta-600)', textDecoration: 'none', fontWeight: 600 }}>support@guthub.ai</a>.</>}
        >
          <h2 style={h2}>Introduction</h2>
          <p style={p}>Guthub (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) provides AI-powered gut-health nutrition guidance through our website and app. This Privacy Policy explains how we collect, use, store, and protect your information when you use our service. Because Guthub involves personal and health-related information, we take your privacy seriously and have designed our practices to keep your data secure and under your control.</p>
          <p style={p}>By using Guthub, you agree to the practices described in this policy. If you do not agree, please do not use the service.</p>

          <h2 style={h2}>Information we collect</h2>
          <p style={p}>When you use Guthub, we collect the following types of information:</p>

          <h3 style={h3}>Information you provide directly:</h3>
          <ul style={ul}>
            <li>Account information: name, email address, password</li>
            <li>Intake information: dietary preferences, food sensitivities, medical conditions you choose to share, current weight, height, goals, lifestyle factors</li>
            <li>Meal logs and photos</li>
            <li>Symptom reports and feedback</li>
            <li>Conversations with the AI coach</li>
            <li>Lab results or test reports you upload (optional)</li>
            <li>Payment information (processed by our payment provider, not stored by us)</li>
          </ul>

          <h3 style={h3}>Information collected automatically:</h3>
          <ul style={ul}>
            <li>Device and browser information</li>
            <li>IP address and approximate location</li>
            <li>Usage data, such as which features you use and how often</li>
            <li>Cookies and similar tracking technologies (see our Cookie Policy)</li>
          </ul>

          <h2 style={h2}>How we use your information</h2>
          <p style={p}>We use your information to:</p>
          <ul style={ul}>
            <li>Provide and personalize the Guthub service</li>
            <li>Generate AI-powered nutrition guidance, meal plans, and feedback tailored to your profile</li>
            <li>Improve our service and develop new features</li>
            <li>Communicate with you about your account, our service, and updates</li>
            <li>Process payments and manage subscriptions</li>
            <li>Comply with legal obligations</li>
            <li>Protect the security and integrity of our service</li>
          </ul>
          <p style={p}>We do not use your information for third-party advertising. We do not sell your data.</p>

          <h2 style={h2}>How we share your information</h2>
          <p style={p}>We share your information only in limited circumstances:</p>
          <p style={p}><strong>Service providers:</strong> We work with third-party companies to operate Guthub, including hosting providers, payment processors, email services, and AI infrastructure providers. These providers only access information necessary to perform their services and are bound by confidentiality obligations.</p>
          <p style={p}><strong>Legal requirements:</strong> We may disclose information if required by law, court order, or to protect our rights, users, or the public.</p>
          <p style={p}><strong>Business transfers:</strong> If Guthub is involved in a merger, acquisition, or sale, your information may be transferred. You will be notified before this happens.</p>
          <p style={p}>We do not sell your personal information to third parties. We do not share your data with advertisers.</p>

          <h2 style={h2}>AI processing</h2>
          <p style={p}>Guthub uses third-party AI services, including OpenAI, to generate personalized nutrition guidance. When you interact with the AI coach, your conversations and relevant context from your profile are processed by these services to generate responses. Our AI providers are contractually prohibited from using your data to train their general models.</p>

          <h2 style={h2}>Data retention</h2>
          <p style={p}>We keep your information for as long as your account is active or as needed to provide the service. If you delete your account, we will delete your personal data within 30 days, except where retention is required for legal, tax, or fraud-prevention purposes.</p>
          <p style={p}>You can request a full export or deletion of your data at any time by contacting us at <a href="mailto:support@guthub.ai" style={{ color: 'var(--terracotta-600)', textDecoration: 'none', fontWeight: 600 }}>support@guthub.ai</a>.</p>

          <h2 style={h2}>Your rights and choices</h2>
          <p style={p}>Depending on where you live, you may have the following rights:</p>
          <ul style={ul}>
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and associated data</li>
            <li>Export your data in a portable format</li>
            <li>Opt out of certain types of data processing</li>
            <li>Object to or restrict how we use your information</li>
          </ul>
          <p style={p}>To exercise any of these rights, contact us at <a href="mailto:support@guthub.ai" style={{ color: 'var(--terracotta-600)', textDecoration: 'none', fontWeight: 600 }}>support@guthub.ai</a>. We will respond within 30 days.</p>
          <p style={p}>If you are a California resident, you have additional rights under the CCPA/CPRA. If you are in the EU or UK, you have rights under GDPR. We honor these rights regardless of where you live.</p>

          <h2 style={h2}>Security</h2>
          <p style={p}>We use industry-standard security measures to protect your information, including encryption in transit and at rest, secure authentication, and limited internal access controls. No system is perfectly secure, but we work hard to protect your data and will notify you in the event of any breach affecting your information.</p>

          <h2 style={h2}>Children&rsquo;s privacy</h2>
          <p style={p}>Guthub is not intended for children under 18. We do not knowingly collect personal information from children. If you believe a child has provided us information, contact us and we will delete it.</p>

          <h2 style={h2}>Changes to this policy</h2>
          <p style={p}>We may update this Privacy Policy as our service evolves or as required by law. We will notify you of material changes via email or through the service. The &ldquo;Last updated&rdquo; date at the top of this policy indicates when it was last revised.</p>

          <h2 style={h2}>Contact us</h2>
          <p style={p}>For privacy questions, requests, or concerns, contact us at:</p>
          <p style={p}><a href="mailto:support@guthub.ai" style={{ color: 'var(--terracotta-600)', textDecoration: 'none', fontWeight: 600 }}>support@guthub.ai</a></p>
        </ContentPage>
        <FinalCTA />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
