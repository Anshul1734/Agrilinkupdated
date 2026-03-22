
import React from "react";
import Layout from "@/components/Layout";
import { Separator } from "@/components/ui/separator";

const About: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">About Agrilink</h1>
          <p className="text-muted-foreground mb-8">Connecting farmers and consumers for a sustainable future</p>
          <Separator className="mb-8" />
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="mb-4">
              At Agrilink, we're on a mission to transform the agricultural supply chain by connecting 
              farmers directly to consumers. We believe in fair prices for farmers, fresh produce for 
              consumers, and sustainable practices for our planet.
            </p>
            <p>
              By eliminating unnecessary middlemen, we ensure that farmers receive better compensation 
              for their hard work while consumers enjoy fresher, more affordable produce.
            </p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="mb-4">
              Agrilink was founded in 2023 by a team of agricultural experts and technology 
              enthusiasts who saw the challenges faced by small-scale farmers. Despite their hard work, 
              many farmers struggled to get fair prices for their produce due to complex supply chains.
            </p>
            <p>
              We created a platform that leverages technology to bridge this gap, empowering farmers 
              with direct market access and providing consumers with transparency about where their 
              food comes from.
            </p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="text-agrilink-primary font-bold text-xl mb-2">1</div>
                <h3 className="font-semibold mb-2">Farmers List Products</h3>
                <p className="text-sm text-muted-foreground">
                  Local farmers list their fresh produce, setting their own prices and quantities.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="text-agrilink-primary font-bold text-xl mb-2">2</div>
                <h3 className="font-semibold mb-2">Consumers Browse & Buy</h3>
                <p className="text-sm text-muted-foreground">
                  Customers browse listings and place orders directly with farmers.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="text-agrilink-primary font-bold text-xl mb-2">3</div>
                <h3 className="font-semibold mb-2">Direct Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Products are delivered fresh from farm to table, ensuring quality and freshness.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
