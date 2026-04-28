import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import FinalCTA from '@/components/FinalCTA';
import ContentPage from '@/components/ContentPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy — GutHub',
  description: 'How GutHub uses cookies and similar technologies.',
};

const h2: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400,
  lineHeight: 1.25, letterSpacing: '-0.01em',
  color: 'var(--ink-900)', marginTop: 40, marginBottom: 14,
};

const p: React.CSSProperties = { margin: '0 0 16px' };
const ul: React.CSSProperties = { margin: '0 0 18px', paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 };
const emailLink: React.CSSProperties = { color: 'var(--terracotta-600)', textDecoration: 'none', fontWeight: 600 };

export default function CookiesPage() {
  return (
    <>
      <Header />
      <main>
        <ContentPage
          eyebrow="Legal"
          title="Cookie Policy"
          lastUpdated="April 27, 2026"
          disclaimer={<>This document is provided for informational purposes. For specific legal questions, please contact us at <a href="mailto:support@guthub.ai" style={emailLink}>support@guthub.ai</a>.</>}
        >
          <h2 style={h2}>What are cookies</h2>
          <p style={p}>Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work, improve user experience, and provide information to website owners.</p>

          <h2 style={h2}>How we use cookies</h2>
          <p style={p}>Guthub uses cookies and similar technologies for the following purposes:</p>
          <p style={p}><strong>Essential cookies:</strong> Required for the Service to function. These enable account login, session management, and security. You cannot disable these without breaking the Service.</p>
          <p style={p}><strong>Functional cookies:</strong> Remember your preferences, such as language and display settings, to provide a smoother experience.</p>
          <p style={p}><strong>Analytics cookies:</strong> Help us understand how visitors use Guthub so we can improve the product. These cookies collect aggregated, anonymized data about page visits, feature usage, and user flows. We use [analytics provider, to be specified] for this purpose.</p>
          <p style={p}><strong>Performance cookies:</strong> Help us measure and improve site performance, including load times and error tracking.</p>
          <p style={p}>We do not use cookies for third-party advertising or to track you across other websites.</p>

          <h2 style={h2}>Third-party cookies</h2>
          <p style={p}>Some cookies on our site are set by third-party services we use, such as our payment processor (Stripe) and analytics provider. These third parties have their own privacy policies governing their use of cookies.</p>

          <h2 style={h2}>Managing cookies</h2>
          <p style={p}>Most browsers allow you to control cookies through their settings. You can typically:</p>
          <ul style={ul}>
            <li>Accept or reject cookies</li>
            <li>Delete cookies after each session</li>
            <li>Be notified when a cookie is set</li>
          </ul>
          <p style={p}>Disabling essential cookies will prevent Guthub from functioning properly.</p>

          <h2 style={h2}>Changes to this policy</h2>
          <p style={p}>We may update this Cookie Policy as our use of cookies evolves. The &ldquo;Last updated&rdquo; date indicates when this policy was last revised.</p>

          <h2 style={h2}>Contact</h2>
          <p style={p}>For questions about our use of cookies, contact us at <a href="mailto:support@guthub.ai" style={emailLink}>support@guthub.ai</a>.</p>
        </ContentPage>
        <FinalCTA />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
