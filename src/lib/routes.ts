import type { UserType } from "@/types";

export const dashboardPath = (role: UserType | null | undefined) =>
  role === "Farmer" ? "/farmer-dashboard" : "/buyer-dashboard";
