import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TERRAINS, terrainInfo } from "@/data/terrain";
import type { ProfileFormValues } from "@/lib/validation";
import { cn } from "@/lib/utils";

export const FieldError: React.FC<{ message?: string; id?: string }> = ({ message, id }) =>
  message ? (
    <p id={id} className="flex items-start gap-1.5 text-[13px] font-medium text-chili" role="alert">
      <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-chili" aria-hidden="true" />
      {message}
    </p>
  ) : null;

interface Props {
  /** `prefix` keeps element ids unique when two forms exist on one page (login tabs). */
  prefix?: string;
  showRole?: boolean;
}

/** Name / role / phone / address / terrain: shared by sign-up, onboarding and the profile editor. */
const ProfileFields: React.FC<Props> = ({ prefix = "pf", showRole = true }) => {
  const { register, control, watch, formState: { errors } } = useFormContext<ProfileFormValues>();
  const role = watch("role");
  const terrain = watch("terrain");
  const info = terrainInfo(terrain);
  const id = (n: string) => `${prefix}-${n}`;

  return (
    <>
      {showRole && (
        <div className="space-y-2">
          <Label id={id("role-label")}>I'm joining to</Label>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-3" aria-labelledby={id("role-label")}>
                {[
                  { value: "Buyer", title: "Buy food", hint: "Order from farmers" },
                  { value: "Farmer", title: "Sell my harvest", hint: "List and manage stock" },
                ].map((o) => (
                  <Label
                    key={o.value}
                    htmlFor={id(o.value)}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 font-normal leading-normal transition-colors",
                      field.value === o.value ? "border-field bg-field-wash/60 ring-1 ring-field" : "border-input hover:border-field/60",
                    )}
                  >
                    <RadioGroupItem value={o.value} id={id(o.value)} className="mt-0.5" />
                    <span>
                      <span className="block text-sm font-semibold">{o.title}</span>
                      <span className="block text-[13px] text-ink-soft">{o.hint}</span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={id("name")}>Full name</Label>
        <Input id={id("name")} autoComplete="name" placeholder="As you'd like farmers or buyers to see it" aria-invalid={!!errors.name} {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={id("contact")}>Phone number</Label>
        <Input id={id("contact")} type="tel" autoComplete="tel" placeholder="+91 98765 43210" className="figure" aria-invalid={!!errors.contactNumber} {...register("contactNumber")} />
        <FieldError message={errors.contactNumber?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={id("address")}>{role === "Farmer" ? "Farm or pickup address" : "Delivery address"}</Label>
        <Input id={id("address")} autoComplete="street-address" placeholder="House or plot, street, area, city, PIN" aria-invalid={!!errors.address} {...register("address")} />
        <FieldError message={errors.address?.message} />
      </div>

      {role === "Farmer" && (
        <div className="space-y-2 rounded-lg bg-field-wash/50 p-4">
          <Label htmlFor={id("terrain")}>Your terrain</Label>
          <Controller
            control={control}
            name="terrain"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id={id("terrain")} className="w-full" aria-invalid={!!errors.terrain}>
                  <SelectValue placeholder="Choose the land you farm" />
                </SelectTrigger>
                <SelectContent>
                  {TERRAINS.map((t) => (
                    <SelectItem key={t.type} value={t.type}>
                      {t.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={errors.terrain?.message} />
          {info ? (
            <dl className="animate-fade-in space-y-2 pt-1 text-[13px]">
              <div><dt className="font-semibold">Suited crops</dt><dd>{info.crops}</dd></div>
              <div><dt className="font-semibold">Practice</dt><dd>{info.practices}</dd></div>
            </dl>
          ) : (
            <p className="text-[13px] text-ink-soft">We'll suggest crops and practices for your land on your farm page.</p>
          )}
        </div>
      )}
    </>
  );
};

export default ProfileFields;
