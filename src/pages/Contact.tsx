import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Crumbs } from "@/components/PageState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError } from "@/lib/api";

const faqItems = [
  { question: "How does Agrilink connect farmers and buyers?", answer: "Farmers list products with their own prices and stock. Buyers order directly, and each farmer is responsible for fulfilling the items they sold." },
  { question: "How do I pay?", answer: "Payment is cash on delivery. Nothing is charged online; you pay when your items arrive. An order's payment shows as Paid once all of its items are delivered." },
  { question: "Can I order from more than one farmer at once?", answer: "Yes. Each farmer ships their own items, so progress can differ within one order, and shipping is charged once per farmer." },
  { question: "What if I need to cancel?", answer: "You can cancel an item while it is still Pending. Once the farmer starts processing it, contact the farmer or us. Cancelled items return to the farmer's stock." },
  { question: "Who can write a review?", answer: "Only buyers with a delivered order for that product, once per purchase. Reviews are marked as verified purchases." },
  { question: "I'm a farmer. How do I start selling?", answer: "Create a farm account, then add products from your farm page with a photo, price and stock. You'll get a notice whenever someone orders from you." },
];

const Contact: React.FC = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, hidden from people

  const send = useMutation({
    mutationFn: () => api.post("/contact", { name, email, message, website }),
    onSuccess: () => {
      toast({ title: "Message sent", description: "Thanks for reaching out. We'll reply by email." });
      setName("");
      setEmail("");
      setMessage("");
    },
    onError: (err) =>
      toast({ title: "Couldn't send your message", description: err instanceof ApiError ? err.message : "Please try again.", variant: "destructive" }),
  });

  // Contact details come from configuration so nothing invented is ever shown.
  const details = [
    ["Email", import.meta.env.VITE_CONTACT_EMAIL as string | undefined, "mailto:"],
    ["Phone", import.meta.env.VITE_CONTACT_PHONE as string | undefined, "tel:"],
    ["Address", import.meta.env.VITE_CONTACT_ADDRESS as string | undefined, ""],
  ].filter((d): d is [string, string, string] => !!d[1]);

  return (
    <Layout>
      <div className="container py-4 md:py-5">
        <Crumbs items={[{ label: "Home", to: "/" }, { label: "Contact us" }]} />
        <h1 className="mb-4 text-xl font-bold md:text-2xl">Contact us</h1>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_26rem]">
          <section id="faq" aria-labelledby="faq-h" className="panel order-2 p-4 md:p-6 lg:order-1">
            <h2 id="faq-h" className="text-lg font-bold">Frequently asked questions</h2>
            <Accordion type="single" collapsible className="mt-2">
              {faqItems.map((f, i) => (
                <AccordionItem key={f.question} value={`q${i}`}>
                  <AccordionTrigger>{f.question}</AccordionTrigger>
                  <AccordionContent>{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section aria-labelledby="msg-h" className="panel order-1 p-4 md:p-6 lg:order-2 lg:self-start">
            <h2 id="msg-h" className="text-lg font-bold">Send us a message</h2>
            <p className="mt-0.5 text-sm text-ink-soft">We'll reply by email.</p>
            <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="mt-4 space-y-4">
              <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></div>
              <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
              <div className="space-y-1.5"><Label htmlFor="message">Message</Label><Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help? Include an order number if it's about one." rows={5} minLength={10} required /></div>
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="website">Leave this empty</label>
                <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={send.isPending}>{send.isPending && <Loader2 className="animate-spin" />} Send message</Button>
            </form>

            {details.length > 0 && (
              <dl className="mt-6 space-y-3 border-t border-rule pt-5 text-sm">
                {details.map(([k, v, scheme]) => (
                  <div key={k}><dt className="eyebrow">{k}</dt><dd className="mt-0.5 font-medium">{scheme ? <a href={`${scheme}${v}`} className="text-field hover:underline">{v}</a> : v}</dd></div>
                ))}
              </dl>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
