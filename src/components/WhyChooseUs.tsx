
import React from "react";
import { Truck, Shield, Leaf, Wallet } from "lucide-react";

const WhyChooseUs: React.FC = () => {
  const features = [
    {
      icon: <Truck className="h-8 w-8 text-agrilink-primary" />,
      title: "Direct Delivery",
      description: "Get farm-fresh produce delivered straight to your doorstep, cutting out the middleman."
    },
    {
      icon: <Shield className="h-8 w-8 text-agrilink-primary" />,
      title: "Quality Guarantee",
      description: "All products are verified for quality and freshness before shipping to customers."
    },
    {
      icon: <Leaf className="h-8 w-8 text-agrilink-primary" />,
      title: "Sustainable Practices",
      description: "Support farmers who use sustainable and environmentally-friendly farming methods."
    },
    {
      icon: <Wallet className="h-8 w-8 text-agrilink-primary" />,
      title: "Fair Pricing",
      description: "Farmers get better compensation while customers pay less with our direct marketplace model."
    }
  ];

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Agrilink?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're revolutionizing how farmers connect with consumers, creating value for both sides
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
