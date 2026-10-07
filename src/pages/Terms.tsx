import React from "react";
import { Link } from "react-router-dom";
import LegalPage, { LegalSection } from "@/components/LegalPage";

const Terms: React.FC = () => (
  <LegalPage title="Terms of Service" updated="4 October 2026">
    <LegalSection title="Who we are and what we do">
      <p>Agrilink is an online marketplace. Farmers list products; buyers order them. We provide the platform. The sale itself is between the buyer and the farmer, and Agrilink is not the seller of the products.</p>
    </LegalSection>

    <LegalSection title="Accounts">
      <ul className="list-disc space-y-1 pl-6">
        <li>You must give accurate information and keep your sign-in details private.</li>
        <li>You choose a buyer or farmer account when you sign up. It can't be changed afterwards, and farmer accounts can't place orders.</li>
        <li>You are responsible for activity on your account.</li>
      </ul>
    </LegalSection>

    <LegalSection title="For farmers">
      <ul className="list-disc space-y-1 pl-6">
        <li>You set your own prices and stock and must describe products honestly, including whether they are organic, traditional, hybrid or wild.</li>
        <li>You may only list products you are legally allowed to sell, and you must follow food-safety, labelling and licensing rules that apply to you.</li>
        <li>When someone orders, you are responsible for preparing, shipping and delivering the items and keeping order statuses accurate.</li>
        <li>Photos you upload must be yours or used with permission.</li>
      </ul>
    </LegalSection>

    <LegalSection title="For buyers">
      <ul className="list-disc space-y-1 pl-6">
        <li>Prices and stock are confirmed when you place the order. If an item sells out first, the order is not placed.</li>
        <li>Payment is cash on delivery, paid to the farmer when the items arrive. Shipping is charged once per farmer in your order and shown before you order.</li>
        <li>You can cancel an item while it is Pending. After the farmer starts processing it, contact the farmer. Cancelled items return to the farmer's stock.</li>
        <li>Please provide a correct delivery address and phone number.</li>
      </ul>
    </LegalSection>

    <LegalSection title="Reviews">
      <p>Only buyers with a delivered order can review a product, once per purchase. Reviews must be honest and about the product. We may remove reviews that are abusive, unlawful or unrelated.</p>
    </LegalSection>

    <LegalSection title="Not allowed">
      <ul className="list-disc space-y-1 pl-6">
        <li>Unlawful, unsafe or misleadingly described products.</li>
        <li>Fake accounts, fake orders or fake reviews.</li>
        <li>Attempting to disrupt the service, scrape it at scale, or access other people's data.</li>
      </ul>
    </LegalSection>

    <LegalSection title="Our responsibility">
      <p>We work to keep Agrilink available and accurate, but we provide it "as is". We are not responsible for the quality, safety or delivery of products sold by farmers, or for disputes between buyers and farmers, beyond what the law requires. We may suspend accounts that break these terms.</p>
    </LegalSection>

    <LegalSection title="Your data">
      <p>How we handle personal information is described in our <Link to="/privacy" >Privacy Policy</Link>.</p>
    </LegalSection>

    <LegalSection title="Changes">
      <p>We may update these terms. The date above shows the latest version; continuing to use Agrilink after a change means you accept it.</p>
    </LegalSection>
  </LegalPage>
);

export default Terms;
