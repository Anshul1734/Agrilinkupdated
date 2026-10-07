import React from "react";
import { Link } from "react-router-dom";
import { Banknote, ShoppingBasket, Sprout, Truck } from "lucide-react";
import Layout from "@/components/Layout";
import { Crumbs } from "@/components/PageState";

const steps = [
  { icon: Sprout, title: "Farmers list", text: "Local farmers list what they've grown, with their own price and the quantity they have." },
  { icon: ShoppingBasket, title: "You order", text: "Browse, filter by category or how it was grown, and order from one farm or several in a single basket." },
  { icon: Truck, title: "Farmers deliver", text: "Each farmer accepts, ships and delivers their own items. You can follow every item separately." },
  { icon: Banknote, title: "You pay on delivery", text: "Pay in cash when your items arrive, then rate what you received." },
];

const About: React.FC = () => (
  <Layout>
    <div className="container max-w-5xl py-4 md:py-5">
      <Crumbs items={[{ label: "Home", to: "/" }, { label: "About us" }]} />

      <section className="panel overflow-hidden">
        <div className="bg-gradient-to-r from-[#e7f4d4] to-[#bfe38a] p-6 md:p-10">
          <h1 className="max-w-xl text-2xl font-extrabold leading-tight md:text-4xl">Fresh food, straight from the people who grow it</h1>
          <p className="mt-3 max-w-xl text-[15px] text-ink/80">Agrilink is a marketplace where farmers sell directly to buyers: fresher produce, fairer prices, and nobody in the middle.</p>
        </div>
        <div className="grid gap-8 p-6 md:grid-cols-2 md:p-10">
          <div>
            <h2 className="text-lg font-bold">Our mission</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
              We want to shorten the road between the field and the kitchen. By removing unnecessary middlemen, farmers get better compensation for their work and buyers get fresher, more affordable produce.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold">Where Agrilink came from</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
              Agrilink began as a university project around one question: what if a small farmer could reach buyers directly, set their own price, and see exactly what each order is worth? Today it's a working marketplace where every order shows who is responsible for each item.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-4" aria-labelledby="how-h">
        <h2 id="how-h" className="mb-3 text-xl font-bold">How Agrilink works</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="panel p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-field-wash text-field"><Icon className="h-6 w-6" /></span>
              <p className="mt-3 text-xs font-bold text-field">Step {i + 1}</p>
              <h3 className="text-base font-bold">{title}</h3>
              <p className="mt-1 text-[13.5px] text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className="panel mt-4 p-5 text-[15px] font-medium">Have a question? <Link to="/contact#faq" className="font-bold text-field hover:underline">Read the FAQs</Link> or <Link to="/contact" className="font-bold text-field hover:underline">write to us</Link>.</p>
    </div>
  </Layout>
);

export default About;
