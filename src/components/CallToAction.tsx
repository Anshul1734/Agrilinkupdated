import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BellRing, IndianRupee, Camera } from "lucide-react";

/** Seller recruitment banner: the farmer side of the marketplace has to be recruited, so it gets its own block. */
const CallToAction: React.FC = () => (
  <section className="container mt-8" aria-labelledby="sell-h">
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#1f3b12] via-[#2c5316] to-[#3b7219] text-white">
      <div className="grid items-center gap-6 p-6 md:grid-cols-[1.3fr_1fr] md:gap-10 md:p-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-lime">Sell on Agrilink</p>
          <h2 id="sell-h" className="mt-2 text-2xl font-extrabold leading-tight md:text-4xl">Grow it. List it. Name your price.</h2>
          <p className="mt-3 max-w-lg text-[15px] text-white/80">
            Open a seller account, add a photo, a price and your stock, and buyers can order straight away.
          </p>
          <Link to="/login" state={{ defaultTab: "Farmer", action: "signup" }} className="mt-5 inline-flex h-12 items-center gap-2 rounded-lg bg-lime px-6 text-[15px] font-bold text-ink transition-colors hover:bg-white">
            Start selling <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="grid gap-3 text-sm">
          {[
            [Camera, "List a crop in a couple of minutes"],
            [BellRing, "Get notified the moment someone orders"],
            [IndianRupee, "See exactly what each order earns you"],
          ].map(([Icon, text]) => {
            const I = Icon as React.ElementType;
            return (
              <li key={text as string} className="flex items-center gap-3 rounded-lg bg-white/10 p-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime text-ink"><I className="h-[18px] w-[18px]" /></span>
                <span className="font-medium">{text as string}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  </section>
);

export default CallToAction;
