import React from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Loader2, PackageOpen, SearchX, ShoppingBasket, Sprout, TriangleAlert, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PageSpinner: React.FC<{ label?: string }> = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-soft" role="status">
    <Loader2 className="h-7 w-7 animate-spin text-field" />
    <span className="text-sm">{label}</span>
  </div>
);

type Kind = "crate" | "basket" | "ledger" | "search" | "sprout" | "gate";
const ICONS: Record<Kind, React.ElementType> = {
  crate: PackageOpen,
  basket: ShoppingBasket,
  ledger: ClipboardList,
  search: SearchX,
  sprout: Sprout,
  gate: TriangleAlert,
};

interface MessageProps {
  title: string;
  description?: string;
  action?: { label: string; to?: string; onClick?: () => void };
  icon?: React.ReactNode;
  plate?: Kind;
}

/** Empty / error / not-found states share one look: an icon in a pale disc, a plain sentence, one next step. */
export const PageMessage: React.FC<MessageProps> = ({ title, description, action, icon, plate = "crate" }) => {
  const Icon = ICONS[plate];
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center">
      <div className={`mb-5 flex h-20 w-20 items-center justify-center rounded-full ${plate === "gate" ? "bg-chili-wash text-chili" : "bg-field-wash text-field"}`}>
        {icon ?? <Icon className="h-9 w-9" strokeWidth={1.6} />}
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-1.5 text-ink-soft">{description}</p>}
      {action && (
        <div className="mt-5">
          {action.to ? (
            <Button asChild>
              <Link to={action.to}>{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  );
};

/** Section heading: bold title with an optional "View all" style action on the right. */
export const SectionHead: React.FC<{ eyebrow?: string; title: string; children?: React.ReactNode; as?: "h1" | "h2"; className?: string }> = ({
  eyebrow,
  title,
  children,
  as: Tag = "h2",
  className = "",
}) => (
  <div className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-1 ${className}`}>
    <div>
      {eyebrow && <p className="eyebrow mb-0.5">{eyebrow}</p>}
      <Tag className="text-xl font-bold md:text-[1.375rem]">{title}</Tag>
    </div>
    {children}
  </div>
);

/** "View all" link used at the right of a section heading. */
export const ViewAll: React.FC<{ to: string; children?: React.ReactNode }> = ({ to, children = "View all" }) => (
  <Link to={to} className="inline-flex items-center gap-0.5 text-sm font-semibold text-field hover:underline">
    {children} <ChevronRight className="h-4 w-4" />
  </Link>
);

/** Breadcrumb trail used on inner pages. */
export const Crumbs: React.FC<{ items: { label: string; to?: string }[] }> = ({ items }) => (
  <nav aria-label="Breadcrumb" className="mb-3">
    <ol className="flex flex-wrap items-center gap-1 text-[13px] text-ink-soft">
      {items.map((c, i) => (
        <li key={c.label} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
          {c.to ? <Link to={c.to} className="hover:text-field hover:underline">{c.label}</Link> : <span className="text-ink" aria-current="page">{c.label}</span>}
        </li>
      ))}
    </ol>
  </nav>
);

/** Page title block for inner pages: a white band with the title, optional subtitle and actions. */
export const PageHead: React.FC<{ eyebrow?: string; title: string; lede?: string; children?: React.ReactNode }> = ({ eyebrow, title, lede, children }) => (
  <header className="border-b border-rule bg-paper-raised">
    <div className="container flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-5 md:py-6">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-0.5 !text-field">{eyebrow}</p>}
        <h1 className="text-2xl font-bold md:text-[1.75rem]">{title}</h1>
        {lede && <p className="mt-1 text-[14px] text-ink-soft">{lede}</p>}
      </div>
      {children}
    </div>
  </header>
);
