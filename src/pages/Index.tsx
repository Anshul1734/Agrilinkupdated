import React from "react";
import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import FeaturedProducts from "@/components/FeaturedProducts";
import WhyChooseUs from "@/components/WhyChooseUs";
import CallToAction from "@/components/CallToAction";

const Index: React.FC = () => (
  <Layout>
    <Hero />
    <WhyChooseUs />
    <CategorySection />
    <FeaturedProducts />
    <CallToAction />
  </Layout>
);

export default Index;
