import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Slide {
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  to: string;
  state?: unknown;
  /** Tailwind classes for the banner background. */
  bg: string;
  button: string;
  image: string;
}

const img = (id: string) => `https://images.unsplash.com/${id}?w=900&q=70&auto=format&fit=crop`;

const SLIDES: Slide[] = [
  {
    eyebrow: "Direct from the farmer",
    title: "Farm-fresh vegetables at the farmer's own price",
    text: "No middlemen. Order from the person who grew it and pay in cash when it arrives.",
    cta: "Shop now",
    to: "/products",
    bg: "bg-gradient-to-r from-[#e7f4d4] via-[#d6edb4] to-[#bfe38a]",
    button: "bg-field text-white hover:bg-field-deep",
    image: img("photo-1592924357228-91a4daadcfea"),
  },
  {
    eyebrow: "Seasonal fruit",
    title: "Juicy fruit, picked and packed by the grower",
    text: "Browse what's ripe right now, with ratings from buyers who actually received it.",
    cta: "Shop fruits",
    to: "/products?category=2",
    bg: "bg-gradient-to-r from-[#fff1c9] via-[#ffe49a] to-[#ffd466]",
    button: "bg-chili text-white hover:bg-chili/90",
    image: img("photo-1553279768-865429fa0078"),
  },
  {
    eyebrow: "Fresh dairy",
    title: "Milk and dairy from small farms near you",
    text: "Straight from the farm gate, with the farmer's name on every listing.",
    cta: "Shop dairy",
    to: "/products?category=3",
    bg: "bg-gradient-to-r from-[#e3eefb] via-[#cfe2f8] to-[#b5d3f3]",
    button: "bg-indigo text-white hover:bg-indigo/90",
    image: img("photo-1550583724-b2692b85b150"),
  },
  {
    eyebrow: "For farmers",
    title: "Grow it. List it. Set your own price.",
    text: "Open a seller account in minutes and get notified the moment someone orders.",
    cta: "Start selling",
    to: "/login",
    state: { defaultTab: "Farmer", action: "signup" },
    bg: "bg-gradient-to-r from-[#1f3b12] via-[#2f5a17] to-[#3f7a1d]",
    button: "bg-lime text-ink hover:bg-white",
    image: img("photo-1464226184884-fa280b87c399"),
  },
];

/** Promotional banner carousel. Auto-advances, pauses on hover/focus, and never moves for people who prefer reduced motion. */
const Hero: React.FC = () => {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: "start" });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    onSelect();
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  useEffect(() => {
    if (!embla || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => embla.scrollNext(), 5500);
    return () => clearInterval(t);
  }, [embla, paused]);

  const prev = useCallback(() => embla?.scrollPrev(), [embla]);
  const next = useCallback(() => embla?.scrollNext(), [embla]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="container pt-4 md:pt-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="group relative overflow-hidden rounded-xl">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {SLIDES.map((s, i) => (
              <div key={s.title} className="min-w-0 flex-[0_0_100%]" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}`}>
                <div className={cn("relative flex min-h-[15rem] items-center overflow-hidden md:min-h-[21rem]", s.bg)}>
                  <div className={cn("relative z-10 max-w-[62%] p-5 sm:max-w-[55%] md:max-w-[48%] md:p-12", i === 3 ? "text-white" : "text-ink")}>
                    <p className={cn("text-xs font-bold uppercase tracking-wider md:text-[13px]", i === 3 ? "text-lime" : "text-field")}>{s.eyebrow}</p>
                    <h2 className="mt-2 text-xl font-extrabold leading-tight sm:text-2xl md:text-[2.5rem] md:leading-[1.12]">{s.title}</h2>
                    <p className={cn("mt-2 hidden text-[15px] sm:block md:mt-3 md:text-base", i === 3 ? "text-white/85" : "text-ink/75")}>{s.text}</p>
                    <Link to={s.to} state={s.state} tabIndex={index === i ? 0 : -1} className={cn("mt-4 inline-flex h-10 items-center rounded-lg px-5 text-sm font-bold transition-colors md:mt-6 md:h-12 md:px-7 md:text-[15px]", s.button)}>
                      {s.cta}
                    </Link>
                  </div>
                  <img
                    src={s.image}
                    alt=""
                    loading={i === 0 ? "eager" : "lazy"}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                    className="absolute inset-y-0 right-0 h-full w-[45%] object-cover md:w-[48%] [mask-image:linear-gradient(to_right,transparent,black_35%)]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={prev} aria-label="Previous banner" className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-md transition-opacity hover:bg-paper-sunk md:flex md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={next} aria-label="Next banner" className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-md transition-opacity hover:bg-paper-sunk md:flex md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100">
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button key={s.title} onClick={() => embla?.scrollTo(i)} aria-label={`Go to banner ${i + 1}`} aria-current={index === i} className={cn("h-2 rounded-full transition-all", index === i ? "w-6 bg-ink/80" : "w-2 bg-ink/30 hover:bg-ink/50")} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
