
import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

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
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Farming Resources</h1>
        
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Government Schemes for Farmers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {governmentSchemes.map((scheme, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{scheme.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Description:</strong> {scheme.description}</p>
                  <p><strong>Eligibility:</strong> {scheme.eligibility}</p>
                  <a 
                    href={scheme.link} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-agrilink-primary hover:underline inline-flex items-center"
                  >
                    Learn more <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-6">Farming Terrain Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {terrainInfo.map((terrain, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{terrain.type}</CardTitle>
                  <CardDescription>{terrain.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="font-medium mb-2">Suitable Crops:</h4>
                  <div className="flex flex-wrap gap-2">
                    {terrain.crops.map((crop, i) => (
                      <span key={i} className="bg-agrilink-primary/10 text-agrilink-primary px-3 py-1 rounded-full text-sm">
                        {crop}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Resources;
