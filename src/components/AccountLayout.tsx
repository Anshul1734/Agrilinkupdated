import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, MapPin, Package, Sprout, Star, UserRound, Tractor } from "lucide-react";
import Layout from "@/components/Layout";
import { Crumbs } from "@/components/PageState";
import { useAuth } from "@/context/AuthContext";
import { dashboardPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Extra breadcrumb entries after "My Account". */
  crumbs?: { label: string; to?: string }[];
}

/** Shared frame for signed-in pages: a sidebar with the account's sections, and a titled content column. */
const AccountLayout: React.FC<Props> = ({ title, subtitle, actions, children, crumbs = [] }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isFarmer = profile?.role === "Farmer";
  const base = dashboardPath(profile?.role);

  const items = [
    { to: base, label: isFarmer ? "My farm" : "Overview", icon: isFarmer ? Tractor : LayoutDashboard, end: true },
    { to: "/orders", label: isFarmer ? "Sales orders" : "My orders", icon: Package },
    ...(isFarmer ? [{ to: "/resources", label: "Farmer resources", icon: Sprout }] : [{ to: "/my-reviews", label: "My reviews", icon: Star }]),
    { to: "/profile", label: isFarmer ? "Profile & farm address" : "Profile & address", icon: UserRound },
  ];

  const initial = profile?.name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <Layout>
      <div className="container py-4 md:py-5">
        <Crumbs items={[{ label: "Home", to: "/" }, { label: "My Account", to: base }, ...(crumbs.length ? crumbs : [{ label: title }])]} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-5">
          <aside aria-label="Account">
            <div className="panel overflow-hidden">
              <div className="hidden items-center gap-3 border-b border-rule p-4 lg:flex">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-field text-lg font-bold text-white">{initial}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{profile?.name}</p>
                  <p className="truncate text-xs text-ink-soft">{profile?.email}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-field">{isFarmer ? "Seller account" : "Buyer account"}</p>
                </div>
              </div>
              <nav className="scrollbar-none flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible" aria-label="Account sections">
                {items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn("flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-[13.5px] font-semibold transition-colors", isActive ? "bg-field-wash text-field" : "text-ink hover:bg-paper-sunk")
                    }
                  >
                    <Icon className="h-[18px] w-[18px]" /> {label}
                  </NavLink>
                ))}
                <button
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                  className="hidden items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-semibold text-ink-soft transition-colors hover:bg-chili-wash hover:text-chili lg:flex"
                >
                  <LogOut className="h-[18px] w-[18px]" /> Sign out
                </button>
              </nav>
            </div>
            {profile?.address && (
              <Link to="/profile" className="panel mt-4 hidden items-start gap-2.5 p-4 text-[13px] hover:border-field lg:flex">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-field" />
                <span className="min-w-0"><span className="block font-bold">{isFarmer ? "Farm address" : "Delivery address"}</span><span className="block text-ink-soft">{profile.address}</span></span>
              </Link>
            )}
          </aside>

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold md:text-2xl">{title}</h1>
                {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
              </div>
              {actions}
            </div>
            {children}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AccountLayout;
