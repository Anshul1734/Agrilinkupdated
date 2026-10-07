
import React from "react";
import Layout from "@/components/Layout";
import { ArrowUpRight } from "lucide-react";
import { Crumbs } from "@/components/PageState";

interface SchemeItem {
  name: string;
  description: string;
  eligibility: string;
  link: string;
}

interface TerrainInfo {
  type: string;
  description: string;
  crops: string[];
}

const Resources: React.FC = () => {
  const governmentSchemes: SchemeItem[] = [
    {
      name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
      description: "Direct income support of ₹6,000 per year to eligible farmer families in three equal installments.",
      eligibility: "All landholding farmer families with cultivable land.",
      link: "https://pmkisan.gov.in/"
    },
    {
      name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
      description: "Crop insurance scheme that provides financial support to farmers suffering crop loss or damage due to unforeseen events.",
      eligibility: "All farmers, including sharecroppers and tenant farmers growing notified crops.",
      link: "https://pmfby.gov.in/"
    },
    {
      name: "Kisan Credit Card (KCC)",
      description: "Provides farmers with affordable credit for their agricultural needs.",
      eligibility: "All farmers, sharecroppers, tenant farmers, and SHGs of farmers.",
      link: "https://www.nabard.org/content1.aspx?id=23&catid=23"
    },
    {
      name: "Soil Health Card Scheme",
      description: "Provides soil health cards to farmers which carry crop-wise recommendations of nutrients/fertilizers required.",
      eligibility: "All farmers across India.",
      link: "https://soilhealth.dac.gov.in/"
    },
    {
      name: "National Mission for Sustainable Agriculture (NMSA)",
      description: "Promotes sustainable agriculture through climate change adaptation measures, water use efficiency, soil health management, etc.",
      eligibility: "Farmers in identified climate-vulnerable districts.",
      link: "https://nmsa.dac.gov.in/"
    }
  ];

  const terrainInfo: TerrainInfo[] = [
    {
      type: "Plains",
      description: "Flat or gently rolling terrain, ideal for mechanized farming and irrigation systems.",
      crops: ["Rice", "Wheat", "Sugarcane", "Cotton", "Vegetables"]
    },
    {
      type: "Hills",
      description: "Sloped terrain with cooler climate, suitable for terraced farming.",
      crops: ["Tea", "Coffee", "Spices", "Fruits", "Medicinal Plants"]
    },
    {
      type: "Coastal",
      description: "Land near sea with moderate temperature and high humidity.",
      crops: ["Coconut", "Rice", "Cashew", "Fish (aquaculture)", "Bananas"]
    },
    {
      type: "Wetlands",
      description: "Areas that are saturated with water, either permanently or seasonally.",
      crops: ["Rice", "Jute", "Water Chestnut", "Lotus", "Aquatic Vegetables"]
    },
    {
      type: "Drylands",
      description: "Areas with limited rainfall requiring drought-resistant farming techniques.",
      crops: ["Millets", "Pulses", "Barley", "Mustard", "Groundnut"]
    },
    {
      type: "Mountainous",
      description: "High-altitude regions with steep slopes and distinct microclimates.",
      crops: ["Apples", "Walnuts", "Saffron", "Potatoes", "Buckwheat"]
    }
  ];

  return (
    <Layout>
      <div className="container py-4 md:py-5">
        <Crumbs items={[{ label: "Home", to: "/" }, { label: "Farmer resources" }]} />
        <h1 className="text-xl font-bold md:text-2xl">Farmer resources</h1>
        <p className="mb-4 mt-0.5 max-w-2xl text-sm text-ink-soft">Government support you may be entitled to, and what tends to grow well on each kind of land. Check each scheme's official page for current terms.</p>

        <section aria-labelledby="schemes-h">
          <h2 id="schemes-h" className="mb-3 text-lg font-bold">Government schemes</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {governmentSchemes.map((scheme) => (
              <li key={scheme.name} className="panel flex flex-col p-4">
                <h3 className="text-[15px] font-bold leading-snug">{scheme.name}</h3>
                <p className="mt-2 text-[14px] leading-relaxed">{scheme.description}</p>
                <p className="mt-2 text-[13px] text-ink-soft"><span className="font-semibold text-ink">Who qualifies: </span>{scheme.eligibility}</p>
                <a href={scheme.link} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-field hover:underline">
                  Official page <ArrowUpRight className="h-4 w-4" /><span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8" aria-labelledby="terrain-h">
          <h2 id="terrain-h" className="mb-3 text-lg font-bold">Land and what suits it</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {terrainInfo.map((terrain) => (
              <li key={terrain.type} className="panel p-4">
                <h3 className="text-[15px] font-bold">{terrain.type}</h3>
                <p className="mt-1 text-[13.5px] text-ink-soft">{terrain.description}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {terrain.crops.map((c) => <li key={c} className="rounded-full bg-field-wash px-2.5 py-1 text-xs font-semibold text-field">{c}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Layout>
  );
};

export default Resources;
