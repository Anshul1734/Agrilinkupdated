import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import ProfileFields, { FieldError } from "@/components/ProfileFields";
import { PageSpinner } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { dashboardPath } from "@/lib/routes";
import { authErrorMessage, profileFormSchema, type ProfileFormValues , asProfileForm } from "@/lib/validation";

/** One-time step for accounts that exist in Firebase but have no Agrilink profile yet. */
const CompleteProfile: React.FC = () => {
  const { status, profile, firebaseUser, createProfile } = useAuth();
  const navigate = useNavigate();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { role: "Buyer", name: firebaseUser?.displayName ?? "", contactNumber: "", address: "", terrain: "" },
  });

  if (status === "loading") return <Layout><PageSpinner /></Layout>;
  if (status === "signedOut") return <Navigate to="/login" replace />;
  if (status === "ready") return <Navigate to={dashboardPath(profile?.role)} replace />;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createProfile({ ...values, terrain: values.role === "Farmer" ? values.terrain : undefined });
      navigate(dashboardPath(values.role), { replace: true });
    } catch (err) {
      form.setError("root", { message: authErrorMessage(err) });
    }
  });

  return (
    <Layout>
      <div className="container py-6 md:py-10">
        <div className="panel mx-auto max-w-lg p-5 sm:p-8">
          <p className="eyebrow !text-field">One last step</p>
          <h1 className="mt-1 text-2xl font-bold">Finish setting up your account</h1>
          <p className="mt-1 text-sm text-ink-soft">Farmers and buyers need to reach each other about orders. You choose buyer or seller once; it can't be changed later.</p>
          <FormProvider {...asProfileForm(form)}>
            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <ProfileFields prefix="cp" />
              <FieldError message={form.formState.errors.root?.message} />
              <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" />} Continue
              </Button>
            </form>
          </FormProvider>
        </div>
      </div>
    </Layout>
  );
};

export default CompleteProfile;
