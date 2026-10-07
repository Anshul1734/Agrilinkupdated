import React, { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ProfileFields";
import { PRODUCTION_TYPES, UNITS } from "@/data/catalog";
import { api, ApiError } from "@/lib/api";
import { useCategories } from "@/lib/queries";
import { productFormSchema, type ProductFormValues } from "@/lib/productForm";
import { resolveMockImage } from "@/mocks/api";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types";

const EMPTY: ProductFormValues = {
  name: "", categoryId: undefined as unknown as number, price: undefined as unknown as number,
  quantityAvailable: undefined as unknown as number, unit: "kg", productionType: "Organic", description: "", imageUrl: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this product instead of creating one. */
  product?: Product | null;
}

const ProductFormDialog: React.FC<Props> = ({ open, onOpenChange, product }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const categories = useCategories();
  const editing = !!product;
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({ resolver: zodResolver(productFormSchema), defaultValues: EMPTY });
  const { register, control, handleSubmit, reset, setError, setValue, watch, formState: { errors, dirtyFields } } = form;
  const imageUrl = watch("imageUrl");

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setUploadError("Choose a JPEG, PNG or WebP image.");
    if (file.size > 3 * 1024 * 1024) return setUploadError("That image is over 3 MB. Please choose a smaller one.");
    setUploading(true);
    try {
      const { url } = await api.upload<{ url: string }>("/uploads/product-image", file);
      setValue("imageUrl", url, { shouldDirty: true, shouldValidate: true });
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  // Reset whenever the dialog opens so a previous edit never leaks into the next one.
  useEffect(() => {
    if (!open) return;
    setUploadError(null);
    reset(
      product
        ? {
            name: product.name,
            categoryId: product.categoryId,
            price: product.price,
            quantityAvailable: product.quantityAvailable,
            unit: (UNITS as readonly string[]).includes(product.unit) ? (product.unit as ProductFormValues["unit"]) : "kg",
            productionType: (PRODUCTION_TYPES as readonly string[]).includes(product.productionType ?? "")
              ? (product.productionType as ProductFormValues["productionType"])
              : "Traditional",
            description: product.description ?? "",
            imageUrl: product.imageUrl ?? "",
          }
        : EMPTY,
    );
  }, [open, product, reset]);

  const save = useMutation({
    mutationFn: (values: ProductFormValues) => {
      if (!editing) return api.post<Product>("/products", values);
      // Send ONLY what the farmer changed. Sending the whole form would overwrite the stock with the number
      // that was on screen when the dialog opened, silently undoing any orders placed in the meantime.
      const patch: Partial<ProductFormValues> = {};
      for (const key of Object.keys(dirtyFields) as (keyof ProductFormValues)[]) (patch as Record<string, unknown>)[key] = values[key];
      return api.patch<Product>(`/products/${product!.id}`, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: editing ? "Product updated" : "Product added", description: editing ? "Your changes are live." : "Buyers can see it now." });
      onOpenChange(false);
    },
    onError: (err) => setError("root", { message: err instanceof ApiError ? err.message : "Couldn't save the product." }),
  });

  const field = (label: string, id: string, error: string | undefined, input: React.ReactNode) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {input}
      <FieldError message={error} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit product" : "Add a product"}</DialogTitle>
          <DialogDescription>{editing ? "Only the fields you change are saved. Use “Restock” on your farm page to set stock quickly." : "Buyers see this straight away. You can change the price, photo and details any time."}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => {
            if (editing && Object.keys(dirtyFields).length === 0) return onOpenChange(false); // nothing changed
            save.mutate(v);
          })}
          className="space-y-4"
          noValidate
        >
          {field("Product name", "pf-name", errors.name?.message, <Input id="pf-name" placeholder="e.g. Organic Tomatoes" {...register("name")} />)}

          <div className="grid grid-cols-2 gap-4">
            {field("Category", "pf-category", errors.categoryId?.message,
              <Controller control={control} name="categoryId" render={({ field: f }) => (
                <Select value={f.value ? String(f.value) : ""} onValueChange={(v) => f.onChange(Number(v))}>
                  <SelectTrigger id="pf-category"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {categories.data?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />,
            )}
            {field("Production type", "pf-type", errors.productionType?.message,
              <Controller control={control} name="productionType" render={({ field: f }) => (
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger id="pf-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRODUCTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              )} />,
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {field("Price", "pf-price", errors.price?.message,
              <Input id="pf-price" type="number" step="0.01" min="0" inputMode="decimal" {...register("price", { valueAsNumber: true })} />)}
            {field("Unit", "pf-unit", errors.unit?.message,
              <Controller control={control} name="unit" render={({ field: f }) => (
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger id="pf-unit"><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              )} />,
            )}
            {field("In stock", "pf-qty", errors.quantityAvailable?.message,
              <Input id="pf-qty" type="number" step="1" min="0" inputMode="numeric" {...register("quantityAvailable", { valueAsNumber: true })} />)}
          </div>

          {field("Description", "pf-desc", errors.description?.message,
            <Textarea id="pf-desc" rows={3} placeholder="Freshness, variety, how it was grown…" {...register("description")} />)}

          <div className="space-y-2">
            <Label htmlFor="pf-image">Photo (optional)</Label>
            <div className="flex items-center gap-3">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-input bg-paper-sunk">
                {imageUrl ? <img src={resolveMockImage(imageUrl)} alt="Product preview" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-ink-soft" />}
              </div>
              <div className="flex flex-wrap gap-2">
                <input ref={fileInput} type="file" aria-label="Upload product photo" accept="image/jpeg,image/png,image/webp" className="sr-only" id="pf-file" onChange={(e) => onFile(e.target.files?.[0])} />
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInput.current?.click()}>
                  {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
                  {imageUrl ? "Replace photo" : "Upload photo"}
                </Button>
                {imageUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setValue("imageUrl", "", { shouldDirty: true })}>
                    <X /> Remove
                  </Button>
                )}
              </div>
            </div>
            <p className="text-[13px] text-ink-soft">JPEG, PNG or WebP, up to 3 MB.</p>
            <FieldError message={uploadError ?? errors.imageUrl?.message} />
            <input id="pf-image" type="hidden" {...register("imageUrl")} />
          </div>

          <FieldError message={errors.root?.message} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending || uploading}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {editing ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
