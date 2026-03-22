import React from "react";
import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import FeaturedProducts from "@/components/FeaturedProducts";
import WhyChooseUs from "@/components/WhyChooseUs";
import Testimonials from "@/components/Testimonials";
import CallToAction from "@/components/CallToAction";

const Index: React.FC = () => {
  return (
    <Layout>
      <Hero />
      <CategorySection />
      <FeaturedProducts />
      <WhyChooseUs />
      <Testimonials />
      <CallToAction />
    </Layout>
  );
};

export default Index;
