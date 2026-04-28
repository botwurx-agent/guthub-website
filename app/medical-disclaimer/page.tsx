import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import FinalCTA from '@/components/FinalCTA';
import ContentPage from '@/components/ContentPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Medical Disclaimer — GutHub',
  description: 'GutHub is designed to complement, not replace, professional medical care.',
};

const h2: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400,
  lineHeight: 1.25, letterSpacing: '-0.01em',
  color: 'var(--ink-900)', marginTop: 40, marginBottom: 14,
};

const p: React.CSSProperties = { margin: '0 0 16px' };
const ul: React.CSSProperties = { margin: '0 0 18px', paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 };
const emailLink: React.CSSProperties = { color: 'var(--terracotta-600)', textDecoration: 'none', fontWeight: 600 };

export default function MedicalDisclaimerPage() {
  return (
    <>
      <Header />
      <main>
        <ContentPage
          eyebrow="Legal"
          title="Medical Disclaimer"
          lastUpdated="April 27, 2026"
          disclaimer={<>This document is provided for informational purposes. For specific legal questions, please contact us at <a href="mailto:support@guthub.ai" style={emailLink}>support@guthub.ai</a>.</>}
        >
          <h2 style={h2}>Guthub is not a medical service</h2>
          <p style={p}>Guthub provides AI-powered nutrition guidance and gut-health coaching. It is designed to complement, not replace, professional medical care. The Service does not diagnose, treat, cure, or prevent any disease, condition, or medical issue.</p>
          <p style={p}>The information provided by Guthub, including AI-generated responses, meal plans, lab report context, and any other content, is for informational and educational purposes only. It is not medical advice and should not be relied upon as such.</p>

          <h2 style={h2}>Always consult qualified professionals</h2>
          <p style={p}>For any medical concern, including but not limited to:</p>
          <ul style={ul}>
            <li>Diagnosing a condition or illness</li>
            <li>Interpreting medical test results in a clinical context</li>
            <li>Starting, stopping, or changing medications or supplements</li>
            <li>Treating gastrointestinal symptoms that are severe, persistent, or worsening</li>
            <li>Managing chronic conditions</li>
            <li>Pregnancy, breastfeeding, or pediatric concerns</li>
            <li>Mental health concerns</li>
          </ul>
          <p style={p}>&hellip;you should consult a qualified healthcare provider, such as a physician, registered dietitian, gastroenterologist, or licensed therapist. Do not delay seeking medical care because of information you obtained through Guthub.</p>

          <h2 style={h2}>Red-flag symptoms require immediate attention</h2>
          <p style={p}>If you experience any of the following, seek immediate medical care:</p>
          <ul style={ul}>
            <li>Blood in stool or vomit</li>
            <li>Severe abdominal pain</li>
            <li>Sudden, unexplained weight loss</li>
            <li>Difficulty swallowing</li>
            <li>Persistent vomiting</li>
            <li>Signs of an allergic reaction</li>
            <li>Any symptom you believe to be an emergency</li>
          </ul>
          <p style={p}>In a medical emergency, call your local emergency number or go to the nearest emergency room.</p>

          <h2 style={h2}>AI limitations</h2>
          <p style={p}>Guthub&rsquo;s AI coach generates responses based on the information you provide and general nutrition knowledge. It may make errors, miss context, or provide guidance that is not appropriate for your specific situation. Always use your own judgment and consult professionals for decisions that matter to your health.</p>

          <h2 style={h2}>Guthub&rsquo;s role</h2>
          <p style={p}>Guthub is best used for:</p>
          <ul style={ul}>
            <li>Day-to-day nutrition decisions</li>
            <li>Tracking symptoms and meals</li>
            <li>Identifying patterns over time</li>
            <li>Generating meal plans within your dietary preferences</li>
            <li>Asking questions about general nutrition and gut health</li>
            <li>Preparing for conversations with healthcare providers</li>
          </ul>
          <p style={p}>Guthub is not a substitute for professional medical care, regardless of how convenient or accessible it may seem.</p>

          <h2 style={h2}>Clinical advisorship</h2>
          <p style={p}>Guthub is shaped by input from a certified gut health practitioner who reviews how the AI provides guidance. This advisorship informs the system&rsquo;s design and safety guardrails. It does not constitute a doctor-patient relationship between users and the advisor, and does not transform Guthub into a medical service.</p>

          <h2 style={h2}>Acknowledgment</h2>
          <p style={p}>By using Guthub, you acknowledge that you have read and understood this Medical Disclaimer and agree to use the Service accordingly.</p>

          <h2 style={h2}>Contact</h2>
          <p style={p}>For questions about this disclaimer, contact us at <a href="mailto:support@guthub.ai" style={emailLink}>support@guthub.ai</a>.</p>
        </ContentPage>
        <FinalCTA />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
