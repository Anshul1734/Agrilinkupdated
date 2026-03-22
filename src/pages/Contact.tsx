
import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, ArrowDown, ArrowUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FaqItem {
  question: string;
  answer: string;
}

const Contact: React.FC = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "We'll get back to you as soon as possible.",
    });
    setName("");
    setEmail("");
    setMessage("");
  };

  const toggleFaq = (index: number) => {
    if (expandedFaq === index) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(index);
    }
  };

  const faqItems: FaqItem[] = [
    {
      question: "How does Agrilink connect farmers and buyers?",
      answer: "Agrilink provides a direct marketplace platform where farmers can list their products and buyers can purchase directly, eliminating middlemen and ensuring better prices for both parties."
    },
    {
      question: "What types of products can I find on Agrilink?",
      answer: "You can find various agricultural products including vegetables, fruits, grains, dairy, poultry, seafood, herbs, spices, nuts, and farm-fresh beverages."
    },
    {
      question: "How do I know the products are fresh?",
      answer: "All products on Agrilink come directly from local farms, ensuring freshness. Products are harvested and delivered within a short timeframe, and we maintain strict quality control standards."
    },
    {
      question: "Can farmers get assistance with understanding market prices?",
      answer: "Yes, Agrilink provides market intelligence tools for farmers to understand current market trends and set competitive prices for their products."
    },
    {
      question: "How does Agrilink support sustainable farming?",
      answer: "We prioritize and highlight farmers who use sustainable farming practices. We also conduct workshops and provide resources on sustainable agriculture techniques."
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 bg-agrilink-primary/10 rounded-full flex items-center justify-center">
                <Phone className="h-6 w-6 text-agrilink-primary" />
              </div>
              <div>
                <CardTitle>Phone</CardTitle>
                <CardDescription>Call us directly</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p>+91 98765 43210</p>
              <p>+91 12345 67890</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 bg-agrilink-primary/10 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-agrilink-primary" />
              </div>
              <div>
                <CardTitle>Email</CardTitle>
                <CardDescription>Send us a message</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p>contact@agrilink.com</p>
              <p>support@agrilink.com</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 bg-agrilink-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-agrilink-primary" />
              </div>
              <div>
                <CardTitle>Address</CardTitle>
                <CardDescription>Visit our office</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p>123 Farm Road, Agri Tower</p>
              <p>Bengaluru, Karnataka 560001</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Your name" 
                  required 
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Your email" 
                  required 
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
                <Textarea 
                  id="message" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="How can we help?" 
                  rows={5} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full">Send Message</Button>
            </form>
          </div>
          <div className="h-[400px] bg-gray-200 rounded-lg overflow-hidden">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d497698.6600754044!2d77.35072963214122!3d12.954517010112693!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1710052200092!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Agrilink office location"
            ></iframe>
          </div>
        </div>
        
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer p-4 flex flex-row justify-between items-center"
                  onClick={() => toggleFaq(index)}
                >
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                  {expandedFaq === index ? 
                    <ArrowUp className="h-5 w-5" /> : 
                    <ArrowDown className="h-5 w-5" />
                  }
                </CardHeader>
                {expandedFaq === index && (
                  <CardContent className="pt-0 pb-4 px-4">
                    <p>{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
