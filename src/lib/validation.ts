import { z } from "zod";
import type { UseFormReturn } from "react-hook-form";
import { TERRAINS } from "@/data/terrain";

const base = z.object({
  role: z.enum(["Buyer", "Farmer"]),
  name: z.string().trim().min(2, "Enter your full name").max(80),
  contactNumber: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(30)
    .regex(/^[0-9+()\-\s]+$/, "Use only digits, spaces, + ( ) and -"),
  address: z.string().trim().min(5, "Enter your full address").max(200),
  terrain: z.string().optional(),
});

const needsTerrain = (v: { role: string; terrain?: string }, ctx: z.RefinementCtx) => {
  if (v.role === "Farmer" && !TERRAINS.some((t) => t.type === v.terrain)) {
    ctx.addIssue({ code: "custom", path: ["terrain"], message: "Select your terrain type" });
  }
};

export const profileFormSchema = base.superRefine(needsTerrain);
export type ProfileFormValues = z.infer<typeof base>;

export const signUpSchema = base
  .extend({
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters").max(128),
  })
  .superRefine(needsTerrain);
export type SignUpValues = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
export type SignInValues = z.infer<typeof signInSchema>;

/** Firebase error codes -> something a farmer at a market stall can act on. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/weak-password":
      return "That password is too weak. Use at least 8 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return (err as Error)?.message || "Something went wrong. Please try again.";
  }
}

/** Sign-up, onboarding and profile forms all extend the profile fields; this narrows them for FormProvider. */
export const asProfileForm = <T extends ProfileFormValues>(form: UseFormReturn<T>) =>
  form as unknown as UseFormReturn<ProfileFormValues>;
