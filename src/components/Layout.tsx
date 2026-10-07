import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown, Grid2x2, House, LayoutDashboard, LogOut, MapPin, Package, Search, ShoppingBasket, Star, UserRound, Menu,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wordmark } from "@/components/Brand";
import NotificationBell from "@/components/NotificationBell";
import { useQueryClient } from "@tanstack/react-query";
import { MOCK_ENABLED, resetMockState } from "@/mocks/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/lib/queries";
import { dashboardPath } from "@/lib/routes";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const shortAddress = (a?: string | null) => (a ? a.split(",").slice(-2).join(",").trim() || a : "");

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { status, profile, isAuthenticated, signOut } = useAuth();
  const { data: categories = [] } = useCategories();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /** Demo mode only: restores the seed orders and listings, empties every basket, and reloads. */
  const resetDemo = () => {
    resetMockState();
    queryClient.clear();
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("agrilink:cart:v2:")).forEach((k) => localStorage.removeItem(k));
    } catch { /* storage blocked: nothing to clear */ }
    window.location.reload();
  };

  const [bump, setBump] = useState(false);
  const prevCount = useRef(cartCount);
  useEffect(() => {
    if (cartCount > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 350);
      prevCount.current = cartCount;
      return () => clearTimeout(t);
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/products?q=${encodeURIComponent(q)}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast({ title: "Signed out", description: "See you at the next harvest." });
  };

  const signedIn = isAuthenticated && !!profile;
  const isFarmer = profile?.role === "Farmer";
  const accountPath = signedIn ? dashboardPath(profile!.role) : "/login";
  const initial = profile?.name?.trim().charAt(0).toUpperCase() || "?";
  const place = signedIn && profile?.address ? shortAddress(profile.address) : "";

  const searchForm = (cls: string) => (
    <form onSubmit={handleSearch} role="search" className={cn("flex h-11 overflow-hidden rounded-lg border border-input bg-paper-raised transition-shadow focus-within:border-field focus-within:ring-2 focus-within:ring-field/20", cls)}>
      <input
        type="search"
        aria-label="Search for fruits, vegetables, honey and more"
        placeholder="Search for tomatoes, honey, millets…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="min-w-0 flex-1 bg-transparent px-4 text-sm placeholder:text-ink-soft/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <button type="submit" aria-label="Search" className="flex w-12 items-center justify-center bg-field text-white transition-colors hover:bg-field-deep">
        <Search className="h-[18px] w-[18px]" />
      </button>
    </form>
  );

  const locationChip = (
    <Link
      to={signedIn ? "/profile" : "/login"}
      className="flex max-w-[15rem] items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-left hover:border-rule hover:bg-paper-sunk"
      aria-label={place ? `Delivering to ${place}. Change address` : "Set delivery location"}
    >
      <MapPin className="h-5 w-5 shrink-0 text-field" />
      <span className="min-w-0 leading-tight">
        <span className="block text-[11px] font-medium text-ink-soft">{place ? "Delivering to" : "Delivery location"}</span>
        <span className="flex items-center gap-0.5 truncate text-[13px] font-semibold">
          <span className="truncate">{place || "Select location"}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        </span>
      </span>
    </Link>
  );

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn("whitespace-nowrap border-b-2 py-3 text-[13.5px] font-semibold transition-colors hover:text-field", isActive ? "border-field text-field" : "border-transparent text-ink");

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <a href="#main" className="sr-only z-[60] rounded bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-2 focus:top-2">
        Skip to content
      </a>

      {/* Utility bar (desktop) */}
      <div className="hidden border-b border-rule bg-paper-raised md:block">
        <div className="container flex h-9 items-center justify-between text-[12.5px] text-ink-soft">
          <p>Fresh from the farm · Pay on delivery · Direct from farmers</p>
          <nav className="flex items-center gap-5" aria-label="Utility">
            <Link to="/login" state={{ defaultTab: "Farmer", action: "signup" }} className="font-medium hover:text-field">Sell on Agrilink</Link>
            <Link to="/resources" className="font-medium hover:text-field">Farmer resources</Link>
            <Link to="/contact#faq" className="font-medium hover:text-field">Help</Link>
          </nav>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-paper-raised shadow-[0_1px_0_hsl(var(--rule))]">
        <div className="container">
          <div className="flex h-16 items-center gap-3 md:h-[4.5rem] md:gap-6">
            <Link to="/" aria-label="Agrilink home" className="shrink-0"><Wordmark /></Link>
            <div className="hidden md:block">{locationChip}</div>
            {searchForm("hidden max-w-2xl flex-1 md:flex")}

            <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-2">
              {signedIn && <NotificationBell />}
              {signedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden h-11 items-center gap-2 rounded-lg px-2 hover:bg-paper-sunk md:inline-flex" aria-label="Account menu">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-field text-sm font-bold text-white">{initial}</span>
                      <span className="max-w-[6rem] truncate text-sm font-semibold">{profile!.name.split(" ")[0]}</span>
                      <ChevronDown className="h-4 w-4 text-ink-soft" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel className="font-normal">
                      <p className="truncate text-sm font-bold">{profile!.name}</p>
                      <p className="text-xs text-ink-soft">{isFarmer ? "Seller account" : "Buyer account"}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate(dashboardPath(profile!.role))}><LayoutDashboard /> {isFarmer ? "My farm" : "My account"}</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate("/orders")}><Package /> {isFarmer ? "Sales orders" : "My orders"}</DropdownMenuItem>
                    {!isFarmer && <DropdownMenuItem onSelect={() => navigate("/my-reviews")}><Star /> My reviews</DropdownMenuItem>}
                    <DropdownMenuItem onSelect={() => navigate("/profile")}><UserRound /> Profile &amp; address</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleSignOut}><LogOut /> Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                status !== "loading" && (
                  <Link to="/login" className="hidden h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-paper-sunk md:inline-flex">
                    <UserRound className="h-5 w-5" /> Login / Sign up
                  </Link>
                )
              )}
              <Link
                to="/cart"
                aria-label={`Basket, ${cartCount} items`}
                className={cn("inline-flex h-11 items-center gap-2 rounded-lg bg-field px-3.5 text-sm font-semibold text-white transition-colors hover:bg-field-deep", bump && "animate-bump")}
              >
                <ShoppingBasket className="h-5 w-5" />
                <span className="hidden sm:inline">My Basket</span>
                <span className="figure rounded bg-white/20 px-1.5 py-0.5 text-xs font-bold">{cartCount > 99 ? "99+" : cartCount}</span>
              </Link>
            </div>
          </div>

          {/* Phone: search sits under the logo row, like a store app */}
          <div className="pb-3 md:hidden">
            <div className="mb-2 flex items-center">{locationChip}</div>
            {searchForm("w-full")}
          </div>
        </div>

        {/* Category bar (desktop) */}
        <div className="hidden border-t border-rule md:block">
          <div className="container flex items-center gap-7">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="my-1.5 inline-flex h-9 items-center gap-2 rounded-lg bg-field px-3.5 text-[13.5px] font-semibold text-white hover:bg-field-deep">
                  <Menu className="h-4 w-4" /> Shop by Category <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[26rem] p-3">
                <div className="grid grid-cols-2 gap-1">
                  {categories.map((c) => (
                    <DropdownMenuItem key={c.id} onSelect={() => navigate(`/category/${c.id}`)} className="justify-between">
                      <span className="font-medium">{c.name}</span>
                      <span className="figure text-xs text-ink-soft">{c.productCount}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate("/products")} className="font-semibold text-field">See every product</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <nav className="scrollbar-none flex min-w-0 flex-1 items-center gap-6 overflow-x-auto" aria-label="Categories">
              {categories.slice(0, 7).map((c) => (
                <NavLink key={c.id} to={`/category/${c.id}`} className={navClass}>{c.name}</NavLink>
              ))}
              <NavLink to="/products" end className={navClass}>All products</NavLink>
            </nav>
          </div>
        </div>
      </header>

      <main id="main" className="page-pad flex-grow">{children}</main>

      {/* Footer */}
      <footer className="mt-10 border-t border-rule bg-paper-raised">
        <div className="container py-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div className="max-w-xs">
              <Wordmark />
              <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
                Farm-fresh produce, straight from the farmer. Fair prices for the people who grow it, no middlemen, and you pay when it arrives.
              </p>
            </div>
            {[
              { title: "Shop", links: [["All products", "/products"], ["Categories", "/categories"], ["My basket", "/cart"], ["My orders", "/orders"]] },
              { title: "Sell with us", links: [["Become a seller", "/login", { defaultTab: "Farmer", action: "signup" }], ["Farmer resources", "/resources"], ["Government schemes", "/resources"]] },
              { title: "Help", links: [["About Agrilink", "/about"], ["Contact us", "/contact"], ["FAQs", "/contact#faq"], ["Privacy policy", "/privacy"], ["Terms of service", "/terms"]] },
            ].map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="mb-3 text-sm font-bold">{col.title}</h2>
                <ul className="space-y-2 text-[13px]">
                  {col.links.map(([label, to, state]) => (
                    <li key={label as string}><Link to={to as string} state={state} className="text-ink-soft hover:text-field hover:underline">{label as string}</Link></li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {categories.length > 0 && (
            <div className="mt-8 border-t border-rule pt-6">
              <h2 className="mb-3 text-sm font-bold">Popular categories</h2>
              <p className="flex flex-wrap gap-x-1 gap-y-1.5 text-[13px] text-ink-soft">
                {categories.map((c, i) => (
                  <span key={c.id}>
                    <Link to={`/category/${c.id}`} className="hover:text-field hover:underline">{c.name}</Link>
                    {i < categories.length - 1 && <span className="mx-1.5 text-rule-strong">|</span>}
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>
        <div className="border-t border-rule bg-paper">
          <div className="container flex flex-col justify-between gap-1 py-4 text-[12.5px] text-ink-soft sm:flex-row">
            <p>© {new Date().getFullYear()} Agrilink. All rights reserved.</p>
            <p>
              Cash on delivery · Prices set by farmers
              {MOCK_ENABLED && <> · <button type="button" onClick={resetDemo} className="font-medium underline-offset-2 hover:text-field hover:underline">Reset demo data</button></>}
            </p>
          </div>
        </div>
      </footer>

      {/* Phone: bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-rule bg-paper-raised shadow-[0_-2px_8px_rgba(0,0,0,0.06)] md:hidden" aria-label="Quick">
        {[
          { to: "/", label: "Home", icon: House, match: (p: string) => p === "/" },
          { to: "/categories", label: "Categories", icon: Grid2x2, match: (p: string) => p.startsWith("/categor") || p.startsWith("/products") },
          { to: "/cart", label: "Basket", icon: ShoppingBasket, badge: cartCount, match: (p: string) => p.startsWith("/cart") },
          { to: accountPath, label: signedIn ? "Account" : "Login", icon: UserRound, match: (p: string) => p.startsWith("/login") || p.includes("dashboard") || p.startsWith("/profile") || p.startsWith("/order") },
        ].map(({ to, label, icon: Icon, badge, match }) => {
          const active = match(location.pathname);
          return (
            <Link key={label} to={to} aria-current={active ? "page" : undefined} className={cn("relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold", active ? "text-field" : "text-ink-soft")}>
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              <span>{label}</span>
              {!!badge && <span className="figure absolute right-[calc(50%-1.6rem)] top-1.5 rounded-full bg-chili px-1.5 text-[10px] font-bold text-white">{badge > 99 ? "99+" : badge}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
