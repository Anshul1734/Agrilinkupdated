
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CallToAction: React.FC = () => {
  return (
    <section className="py-16 bg-agrilink-primary text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-3xl font-bold mb-2">Ready to Experience Farm-Fresh Quality?</h2>
            <p className="text-white/80 max-w-xl">
              Join thousands of satisfied customers supporting local farmers while enjoying the best produce.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" variant="secondary" className="bg-white text-agrilink-primary hover:bg-white/90 w-full sm:w-auto">
              <Link to="/products">Start Shopping</Link>
            </Button>
            <Button asChild size="lg" className="border-white text-white hover:bg-white/10 w-full sm:w-auto border">
              <Link to="/register">Become a Seller</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
