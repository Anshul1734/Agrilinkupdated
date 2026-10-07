import React from "react";
import LegalPage, { LegalSection } from "@/components/LegalPage";

const contact = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;

const Privacy: React.FC = () => (
  <LegalPage title="Privacy Policy" updated="4 October 2026">
    <LegalSection title="What this covers">
      <p>This policy explains what personal information Agrilink collects, why, who handles it, and the choices you have.</p>
    </LegalSection>

    <LegalSection title="What we collect">
      <ul className="list-disc space-y-1 pl-6">
        <li><strong>Account:</strong> your email address and password (the password is handled by Firebase Authentication; we never see or store it).</li>
        <li><strong>Profile:</strong> your name, phone number, address, whether you are a buyer or a farmer, and (for farmers) your terrain type.</li>
        <li><strong>Orders:</strong> what you ordered, from whom, prices, status, and the delivery address and phone number you had at the time.</li>
        <li><strong>Content you write:</strong> product listings and photos (farmers), reviews (buyers) and messages sent through the contact form.</li>
        <li><strong>Notifications:</strong> in-app messages about your orders and reviews.</li>
      </ul>
    </LegalSection>

    <LegalSection title="Why we use it">
      <p>To run the marketplace: to sign you in, show your orders, let farmers fulfil and deliver what you bought, calculate totals, show verified reviews, and reply to your messages. We do not sell your information and we do not run advertising or tracking.</p>
    </LegalSection>

    <LegalSection title="Who can see what">
      <ul className="list-disc space-y-1 pl-6">
        <li><strong>Farmers</strong> you buy from see your name, delivery address and phone number for the items they must deliver, and nothing about items from other farmers.</li>
        <li><strong>Everyone</strong> can see a farmer's name and listings, and the name, rating and text of any review you write.</li>
        <li><strong>Other buyers</strong> never see your address, phone number or email.</li>
      </ul>
    </LegalSection>

    <LegalSection title="Who processes it for us">
      <p>Firebase (Google) handles sign-in. Supabase hosts our database and product photos. Vercel hosts the website and API. They process data only to provide these services.</p>
    </LegalSection>

    <LegalSection title="Cookies and local storage">
      <p>We do not use advertising or analytics cookies. Your browser stores your shopping cart on your device so it survives a page refresh, and Firebase stores a sign-in session. Signing out removes the session; clearing site data removes the cart.</p>
    </LegalSection>

    <LegalSection title="How long we keep it">
      <p>Account and order information is kept while your account exists and as needed to keep order history accurate. Contact-form messages are kept until answered and then deleted within a reasonable time.</p>
    </LegalSection>

    <LegalSection title="Your choices">
      <p>You can update your name, phone number and address from your profile at any time. You can delete your own reviews. To access, correct or delete your data or account, contact us{contact ? <> at <a href={`mailto:${contact}`}>{contact}</a></> : " through the contact page"}.</p>
    </LegalSection>

    <LegalSection title="Children">
      <p>Agrilink is not intended for children under 13 and we do not knowingly collect their information.</p>
    </LegalSection>

    <LegalSection title="Changes">
      <p>If we change this policy, we will update the date above and, for significant changes, tell you in the app.</p>
    </LegalSection>
  </LegalPage>
);

export default Privacy;
