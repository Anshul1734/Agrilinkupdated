import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import ProfileFields, { FieldError } from "@/components/ProfileFields";
import { Mark } from "@/components/Brand";
import { Banknote, ShieldCheck, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { dashboardPath } from "@/lib/routes";
import { useToast } from "@/hooks/use-toast";
import { isAuthConfigured } from "@/lib/firebase";
import { MOCK_ENABLED } from "@/mocks/api";
import { authErrorMessage, signInSchema, signUpSchema, type SignInValues, type SignUpValues , asProfileForm } from "@/lib/validation";

interface LocationState {
  from?: string;
  defaultTab?: "Buyer" | "Farmer";
  action?: "login" | "signup";
}

const Login: React.FC = () => {
  const { status, profile, signIn, signUp, resetPassword, retry, demoSignIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as LocationState;
  const [tab, setTab] = useState<string>(state.action === "signup" ? "signup" : "login");

  const loginForm = useForm<SignInValues>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "" } });
  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { role: state.defaultTab ?? "Buyer", name: "", email: "", password: "", contactNumber: "", address: "", terrain: "" },
  });

  // Once Firebase + the profile lookup settle, send the user where they were headed.
  useEffect(() => {
    if (status === "ready" && profile) {
      const from = state.from && /^\/(?![/\\])/.test(state.from) ? state.from : null;
      navigate(from ?? dashboardPath(profile.role), { replace: true });
    } else if (status === "needsProfile") {
      navigate("/complete-profile", { replace: true });
    }
  }, [status, profile, navigate, state.from]);

  const onLogin = loginForm.handleSubmit(async ({ email, password }) => {
    try {
      await signIn(email, password);
    } catch (err) {
      loginForm.setError("root", { message: authErrorMessage(err) });
    }
  });

  const onSignUp = signUpForm.handleSubmit(async ({ email, password, ...profileInput }) => {
    try {
      await signUp(email, password, {
        ...profileInput,
        terrain: profileInput.role === "Farmer" ? profileInput.terrain : undefined,
      });
      toast({ title: "You're in", description: `Your ${profileInput.role === "Farmer" ? "farm" : "buyer"} account is ready.` });
    } catch (err) {
      signUpForm.setError("root", { message: authErrorMessage(err) });
    }
  });

  const onForgot = async () => {
    const email = loginForm.getValues("email").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      loginForm.setError("email", { message: "Type your email above first, then choose “Forgot password”." });
      return;
    }
    try {
      await resetPassword(email);
    } catch {
      /* Don't reveal whether the address has an account. */
    }
    toast({ title: "Check your inbox", description: "If an account exists for that email, a reset link is on its way." });
  };

  const busy = loginForm.formState.isSubmitting || signUpForm.formState.isSubmitting || status === "loading";
  const l = loginForm.formState.errors;
  const selling = tab === "signup" && signUpForm.watch("role") === "Farmer";

  return (
    <Layout>
      <div className="container py-6 md:py-10">
        <div className="mx-auto grid max-w-4xl overflow-hidden rounded-xl border border-rule bg-paper-raised shadow-sm md:grid-cols-[2fr_3fr]">
          {/* Left: what you get, and it changes with who is joining */}
          <aside className="hidden flex-col justify-between bg-gradient-to-b from-[#2f6b14] to-[#1f4a0c] p-8 text-white md:flex">
            <div>
              <Mark inverted className="h-11 w-11" />
              <h2 className="mt-5 text-2xl font-extrabold leading-tight">
                {selling ? "Sell your harvest directly" : tab === "signup" ? "Join Agrilink" : "Welcome back"}
              </h2>
              <p className="mt-2 text-sm text-white/80">
                {selling ? "List what you've grown and set your own price." : "Fresh produce from farmers, at the price they set."}
              </p>
            </div>
            <ul className="mt-8 space-y-3.5 text-sm">
              {(selling
                ? [[Store, "Your own storefront, in minutes"], [Banknote, "Keep what you earn, no middlemen"], [Truck, "You decide how and when you ship"]]
                : [[Store, "Buy straight from the farmer"], [Banknote, "Pay on delivery, nothing online"], [ShieldCheck, "Reviews from real buyers only"]]
              ).map(([Icon, text]) => {
                const I = Icon as React.ElementType;
                return (
                  <li key={text as string} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15"><I className="h-4 w-4" /></span>
                    {text as string}
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="p-5 sm:p-8">
            <h1 className="sr-only">Sign in or create an Agrilink account</h1>
            {status === "error" && (
              <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-turmeric/50 bg-turmeric-wash p-3 text-sm" role="alert">
                <span>You're signed in, but we couldn't load your account. The server may be busy.</span>
                <Button size="sm" variant="outline" onClick={retry}>Try again</Button>
              </div>
            )}
            {MOCK_ENABLED && (
              <div className="mb-5 rounded-lg border border-field/40 bg-field-wash p-4">
                <p className="text-sm font-bold">Demo mode</p>
                <p className="mt-0.5 text-[13px] text-ink-soft">No account needed. Jump straight in with sample orders and listings.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Button type="button" onClick={() => demoSignIn("Buyer")}>Continue as demo buyer</Button>
                  <Button type="button" variant="outline" onClick={() => demoSignIn("Farmer")}>Continue as demo farmer</Button>
                </div>
              </div>
            )}
            {!isAuthConfigured && !MOCK_ENABLED && (
              <div className="mb-5 rounded-lg border border-turmeric/50 bg-turmeric-wash p-3 text-sm" role="alert">
                Sign-in isn't set up for this deployment. Add the <code className="font-semibold">VITE_FIREBASE_*</code> variables (see <code className="font-semibold">.env.example</code>).
              </div>
            )}
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-6 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="animate-fade-in">
                <h2 className="text-xl font-bold">Login to your account</h2>
                <p className="mt-0.5 text-sm text-ink-soft">To track your orders or manage your listings.</p>
                <form onSubmit={onLogin} className="mt-5 space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!l.email} {...loginForm.register("email")} />
                    <FieldError message={l.email?.message} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button type="button" onClick={onForgot} className="text-[13px] font-semibold text-field hover:underline">Forgot password?</button>
                    </div>
                    <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!l.password} {...loginForm.register("password")} />
                    <FieldError message={l.password?.message} />
                  </div>
                  <FieldError message={l.root?.message} />
                  <Button type="submit" size="lg" className="w-full" disabled={busy || !(isAuthConfigured || MOCK_ENABLED)}>
                    {busy && <Loader2 className="animate-spin" />} Login
                  </Button>
                </form>
                <p className="mt-5 text-center text-sm text-ink-soft">
                  New to Agrilink? <button onClick={() => setTab("signup")} className="font-bold text-field hover:underline">Create an account</button>
                </p>
              </TabsContent>

              <TabsContent value="signup" className="animate-fade-in">
                <h2 className="text-xl font-bold">Create your account</h2>
                <p className="mt-0.5 text-sm text-ink-soft">Buyer or seller: you choose once, and it can't be changed later.</p>
                <FormProvider {...asProfileForm(signUpForm)}>
                  <form onSubmit={onSignUp} className="mt-5 space-y-4" noValidate>
                    <ProfileFields prefix="su" />
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!signUpForm.formState.errors.email} {...signUpForm.register("email")} />
                      <FieldError message={signUpForm.formState.errors.email?.message} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input id="signup-password" type="password" autoComplete="new-password" aria-invalid={!!signUpForm.formState.errors.password} {...signUpForm.register("password")} />
                      <p className="text-xs text-ink-soft">At least 8 characters.</p>
                      <FieldError message={signUpForm.formState.errors.password?.message} />
                    </div>
                    <FieldError message={signUpForm.formState.errors.root?.message} />
                    <Button type="submit" size="lg" className="w-full" disabled={busy || !(isAuthConfigured || MOCK_ENABLED)}>
                      {busy && <Loader2 className="animate-spin" />} Create account
                    </Button>
                    <p className="text-xs leading-relaxed text-ink-soft">
                      By continuing you agree to our <Link to="/terms" className="font-semibold text-field hover:underline">Terms</Link> and <Link to="/privacy" className="font-semibold text-field hover:underline">Privacy Policy</Link>.
                    </p>
                  </form>
                </FormProvider>
                <p className="mt-5 text-center text-sm text-ink-soft">
                  Already registered? <button onClick={() => setTab("login")} className="font-bold text-field hover:underline">Login</button>
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
