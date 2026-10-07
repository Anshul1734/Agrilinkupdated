import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import AccountLayout from "@/components/AccountLayout";
import ProfileFields, { FieldError } from "@/components/ProfileFields";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/format";
import { authErrorMessage, profileFormSchema, type ProfileFormValues , asProfileForm } from "@/lib/validation";

const Profile: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      role: profile?.role ?? "Buyer",
      name: profile?.name ?? "",
      contactNumber: profile?.contactNumber ?? "",
      address: profile?.address ?? "",
      terrain: profile?.terrain ?? "",
    },
  });

  if (!profile) return null; // RequireAuth guarantees a profile; this only narrows the type.

  const onSubmit = form.handleSubmit(async ({ name, contactNumber, address, terrain }) => {
    try {
      await updateProfile({ name, contactNumber, address, terrain: profile.role === "Farmer" ? terrain : undefined });
      form.reset({ role: profile.role, name, contactNumber, address, terrain });
      toast({ title: "Profile saved" });
    } catch (err) {
      form.setError("root", { message: authErrorMessage(err) });
    }
  });

  return (
    <AccountLayout title="Profile & address" subtitle={`${profile.email} · Member since ${formatDate(profile.created_at)}`}>
      <section className="panel p-4 md:p-6">
        <FormProvider {...asProfileForm(form)}>
          <form onSubmit={onSubmit} className="max-w-xl space-y-4" noValidate>
            <ProfileFields prefix="pr" showRole={false} />
            <FieldError message={form.formState.errors.root?.message} />
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" />} Save changes
              </Button>
              {form.formState.isDirty && <span className="text-[13px] text-ink-soft">You have unsaved changes</span>}
            </div>
          </form>
        </FormProvider>
        <p className="mt-6 max-w-xl border-t border-rule pt-4 text-[13px] text-ink-soft">
          Account type: <span className="font-semibold text-ink">{profile.role === "Farmer" ? "Seller" : "Buyer"}</span> (fixed when you signed up). {profile.role === "Farmer" ? "Buyers never see your phone number or address unless they order from you." : "Farmers see your name, address and phone only for items they must deliver to you."}
        </p>
      </section>
    </AccountLayout>
  );
};

export default Profile;
