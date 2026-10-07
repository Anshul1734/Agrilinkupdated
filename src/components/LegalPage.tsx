import React from "react";
import Layout from "@/components/Layout";
import { Crumbs } from "@/components/PageState";

export const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="border-t border-rule py-5 first:border-t-0 first:pt-0">
    <h2 className="text-base font-bold">{title}</h2>
    <div className="mt-2 space-y-3 text-[14.5px] leading-relaxed [&_a]:font-semibold [&_a]:text-field [&_a]:underline [&_li]:marker:text-ink-soft [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">{children}</div>
  </section>
);

const LegalPage: React.FC<{ title: string; updated: string; children: React.ReactNode }> = ({ title, updated, children }) => (
  <Layout>
    <div className="container max-w-4xl py-4 md:py-5">
      <Crumbs items={[{ label: "Home", to: "/" }, { label: title }]} />
      <article className="panel p-5 md:p-8">
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-ink-soft">Last updated {updated}</p>
        {children}
      </article>
    </div>
  </Layout>
);

export default LegalPage;
