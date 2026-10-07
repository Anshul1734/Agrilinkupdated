import React from "react";
import { Banknote, ShieldCheck, Sprout, Store } from "lucide-react";

const perks = [
  { icon: Store, title: "Straight from the farmer", text: "Every listing is posted by the person who grew it." },
  { icon: Banknote, title: "Pay on delivery", text: "Nothing is charged online. Pay cash when it arrives." },
  { icon: ShieldCheck, title: "Reviews you can trust", text: "Only delivered orders can be reviewed." },
  { icon: Sprout, title: "Fair, farmer-set prices", text: "Farmers choose their price and keep what they earn." },
];

/** Four reasons to shop here, in a single white strip under the banner. */
const WhyChooseUs: React.FC = () => (
  <section className="container mt-5" aria-label="Why shop on Agrilink">
    <ul className="panel grid grid-cols-2 divide-rule lg:grid-cols-4 lg:divide-x">
      {perks.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-start gap-3 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-field-wash text-field">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[13.5px] font-bold leading-snug">{title}</h3>
            <p className="mt-0.5 hidden text-xs text-ink-soft sm:block">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  </section>
);

export default WhyChooseUs;
