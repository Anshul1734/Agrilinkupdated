import React from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

const NotFound: React.FC = () => (
  <Layout>
    <div className="container py-10">
      <div className="panel flex flex-col items-center px-4 py-16 text-center">
        <p className="figure text-8xl font-extrabold leading-none text-field/20" aria-hidden="true">404</p>
        <h1 className="mt-3 text-2xl font-bold">Oops! This page isn't here</h1>
        <p className="mt-1.5 max-w-md text-ink-soft">The page you're looking for doesn't exist or has moved. Let's get you back to shopping.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link to="/products">Browse products</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/">Go to home</Link></Button>
        </div>
      </div>
    </div>
  </Layout>
);

export default NotFound;
