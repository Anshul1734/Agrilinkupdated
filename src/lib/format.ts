// The marketplace serves India (see the Resources page), so prices default to INR.
// Prices in the database are plain numbers; set VITE_CURRENCY / VITE_LOCALE to change only the display.
const CURRENCY = import.meta.env.VITE_CURRENCY || "INR";
const LOCALE = import.meta.env.VITE_LOCALE || "en-IN";

const money = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY, minimumFractionDigits: 0, maximumFractionDigits: 2 });
const moneyExact = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY });
/** Whole amounts read as "₹38"; anything with paise keeps both decimals ("₹38.50"). */
export const formatPrice = (n: number) => (Number.isInteger(n) ? money.format(n) : moneyExact.format(n));

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export const PLACEHOLDER_IMAGE = "/placeholder.svg";

export const timeAgo = (iso: string) => {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const units: [number, string][] = [[86400, "d"], [3600, "h"], [60, "m"]];
  for (const [size, label] of units) if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
  return "just now";
};
