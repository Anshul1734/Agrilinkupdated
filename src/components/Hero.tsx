
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Hero: React.FC = () => {
  return (
    <section className="hero-section py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="animate-slide-in">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Fresh From Farm to Your Table
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90 max-w-md">
              Connect directly with local farmers. Get fresher produce at better prices while supporting sustainable agriculture.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-white text-agrilink-primary hover:bg-white/90">
                <Link to="/products">Explore Products</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white text-white bg-agrilink-primary/40 hover:bg-white/20">
                <Link to="/about" className="flex items-center">
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute -top-16 -left-16 w-32 h-32 bg-agrilink-accent/30 rounded-full filter blur-xl"></div>
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-agrilink-light/30 rounded-full filter blur-xl"></div>
              <img
                src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=600&auto=format&fit=crop"
                alt="Fresh farm produce"
                className="rounded-lg shadow-xl relative z-10 animate-fade-in"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
