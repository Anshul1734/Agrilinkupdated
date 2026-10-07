import type { Profile, UserType } from "@/types";

/** The demo "signed-in" person, kept in localStorage so a refresh keeps you signed in. */
const KEY = "agrilink:mock:role";

export const DEMO_PROFILES: Record<UserType, Profile> = {
  Buyer: {
    uid: "demo-buyer", email: "demo.buyer@agrilink.test", name: "Demo Buyer", role: "Buyer", contactNumber: "9876500001",
    address: "12, 4th Cross, Indiranagar, Bengaluru, Karnataka 560038", terrain: null, created_at: "2026-01-12T09:00:00.000Z",
  },
  Farmer: {
    uid: "f1", email: "demo.farmer@agrilink.test", name: "Green Valley Farms", role: "Farmer", contactNumber: "9876500002",
    address: "Hosur Road, Kolar, Karnataka 563101", terrain: "Red loam, 12 acres", created_at: "2026-01-05T09:00:00.000Z",
  },
};

export const getMockRole = (): UserType | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "Buyer" || v === "Farmer" ? v : null;
  } catch {
    return null;
  }
};

export const setMockRole = (role: UserType | null) => {
  try {
    if (role) localStorage.setItem(KEY, role);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the session just won't survive a refresh */
  }
};

export const getMockProfile = (): Profile | null => {
  const r = getMockRole();
  return r ? DEMO_PROFILES[r] : null;
};
