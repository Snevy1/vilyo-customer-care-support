"use client";

import { UploadCloud } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

// Shadcn/ui imports — add these if missing:
// npx shadcn@latest add dialog button input select label separator form badge
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Assuming these are still in your project
// import { useUpdatePaymentProcessorMutation } from "@/store/payments/payment-processor-api";
// import { useAddAdminNotificationMutation } from "@/store/dashboard/admin-notification-api";

interface PaymentProcessorData {
  _id: string;
  name: string;
  apiKey: string;
  secretKey: string;
  authKey: string;
  logoUrl: string;
  provider: string;
  customerPortalLink: string;
  webhookSecretKey: string;
  userTypes?: string[] | string;
  orgTypes?: string[] | string;
}

interface ViewEditProps {
  data: PaymentProcessorData;
  // onRefetch: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider: z.string().min(1, "Provider is required"),
  apiKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookSecretKey: z.string().optional(),
  customerPortalLink: z.string().optional(),
  authKey: z.string().optional(),
  userTypes: z.array(z.string()).optional(),
  orgTypes: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ViewEdit({ data }: ViewEditProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(data.logoUrl);
  const [providerType, setProviderType] = useState(data.provider.toLowerCase());
  // const [updatePaymentProcessor, { isLoading: isUpdating }] = useUpdatePaymentProcessorMutation();
  // const [addNotification] = useAddAdminNotificationMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data.name || "",
      provider: data.provider || "",
      apiKey: data.apiKey || "",
      secretKey: data.secretKey || "",
      webhookSecretKey: data.webhookSecretKey || "",
      customerPortalLink: data.customerPortalLink || "",
      authKey: data.authKey || "",
      userTypes: Array.isArray(data.userTypes) ? data.userTypes : [],
      orgTypes: Array.isArray(data.orgTypes) ? data.orgTypes : [],
    },
  });

  useEffect(() => {
    if (open) {
      const parsedUserTypes = Array.isArray(data.userTypes)
        ? data.userTypes
        : typeof data.userTypes === "string"
        ? JSON.parse(data.userTypes || "[]")
        : [];
      const parsedOrgTypes = Array.isArray(data.orgTypes)
        ? data.orgTypes
        : typeof data.orgTypes === "string"
        ? JSON.parse(data.orgTypes || "[]")
        : [];

      form.reset({
        name: data.name,
        provider: data.provider,
        apiKey: data.apiKey,
        secretKey: data.secretKey,
        webhookSecretKey: data.webhookSecretKey,
        customerPortalLink: data.customerPortalLink,
        authKey: data.authKey,
        userTypes: parsedUserTypes,
        orgTypes: parsedOrgTypes,
      });

      setPreviewUrl(data.logoUrl);
      setProviderType(data.provider.toLowerCase());
      setFile(null);
    }
  }, [open, data, form]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    if (!uploadedFile.type.startsWith("image/")) {
      console.error("Only image files allowed");
      return;
    }
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    console.log("File selected");
  };

  const onSubmit = async (values: FormValues) => {
    // const formData = new FormData();
    // formData.append("name", values.name);
    // formData.append("provider", values.provider);
    // formData.append("userTypes", JSON.stringify(values.userTypes || []));
    // formData.append("orgTypes", JSON.stringify(values.orgTypes || []));

    // if (values.provider.toLowerCase() === "stripe") {
    //   formData.append("apiKey", values.apiKey || "");
    //   formData.append("secretKey", values.secretKey || "");
    //   formData.append("webhookSecretKey", values.webhookSecretKey || "");
    //   formData.append("customerPortalLink", values.customerPortalLink || "");
    // } else if (values.provider.toLowerCase() === "paypal") {
    //   formData.append("apiKey", values.apiKey || "");
    //   formData.append("secretKey", values.secretKey || "");
    // }

    // if (file) formData.append("file", file);

    // try {
    //   // ... axios.put or RTK mutation
    //   // await addNotification(...)
    //   console.log("Updated successfully (real API call here)");
    //   // onRefetch();
    //   setOpen(false);
    // } catch (err) {
    //   console.error("Update failed");
    // }

    // Local-only simulation
    console.log("Form submitted (local only):", values, file ? "with new file" : "");
    setOpen(false);
  };

  const handleProviderChange = (value: string) => {
    setProviderType(value.toLowerCase());
    form.setValue("apiKey", "");
    form.setValue("secretKey", "");
    form.setValue("webhookSecretKey", "");
    form.setValue("customerPortalLink", "");
  };

  const toggleUserType = (value: string) => {
    const current = form.getValues("userTypes") || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    form.setValue("userTypes", updated);
  };

  const toggleOrgType = (value: string) => {
    const current = form.getValues("orgTypes") || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    form.setValue("orgTypes", updated);
  };

  const userTypeOptions = [
    { value: "student", label: "Student" },
    { value: "notEmployed", label: "Not Employed" },
    { value: "employed", label: "Employed" },
    { value: "retired", label: "Retired" },
  ];

  const orgTypeOptions = [
    { value: "soleTrader", label: "Sole Trader" },
    { value: "partnership", label: "Partnership" },
    { value: "llp", label: "Limited Liability Partnership (LLP)" },
    { value: "ltd", label: "Limited Company (Ltd)" },
    { value: "plc", label: "Public Limited Company (PLC)" },
    { value: "government", label: "Government" },
    { value: "nonProfit", label: "Non-Profit" },
  ];

  const providerOptions = [
    { value: "stripe", label: "Stripe" },
    { value: "paypal", label: "PayPal" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen} >
      <DialogTrigger asChild>
        <span className="cursor-pointer hover:underline">Edit Processor</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-137.5 max-h-[90vh] overflow-y-auto text-zinc-700">
        <DialogHeader>
          <DialogTitle>Edit Payment Processor</DialogTitle>
          <DialogDescription>
            Update the details below and save changes.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-4" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Processor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Processor Provider</FormLabel>
                  <Select onValueChange={(val) => { field.onChange(val); handleProviderChange(val); }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {providerOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter API Key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secretKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter Secret Key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {providerType === "stripe" && (
              <>
                <FormField
                  control={form.control}
                  name="webhookSecretKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook Secret Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter Webhook Secret" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerPortalLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stripe Customer Portal Link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="authKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auth Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter Auth Key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* User Types - simple multi-select via badges */}
            <FormItem>
              <FormLabel>User Types</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.watch("userTypes")?.map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleUserType(type)}
                  >
                    {userTypeOptions.find((o) => o.value === type)?.label || type} ×
                  </Badge>
                ))}
              </div>
              <Select onValueChange={toggleUserType}>
                <SelectTrigger>
                  <SelectValue placeholder="Add user type..." />
                </SelectTrigger>
                <SelectContent>
                  {userTypeOptions
                    .filter((opt) => !form.watch("userTypes")?.includes(opt.value))
                    .map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FormItem>

            {/* Org Types - same pattern */}
            <FormItem>
              <FormLabel>Organization Types</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.watch("orgTypes")?.map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleOrgType(type)}
                  >
                    {orgTypeOptions.find((o) => o.value === type)?.label || type} ×
                  </Badge>
                ))}
              </div>
              <Select onValueChange={toggleOrgType}>
                <SelectTrigger>
                  <SelectValue placeholder="Add organization type..." />
                </SelectTrigger>
                <SelectContent>
                  {orgTypeOptions
                    .filter((opt) => !form.watch("orgTypes")?.includes(opt.value))
                    .map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FormItem>

            {/* Image Upload / Replace */}
            <FormItem>
              <FormLabel>Logo</FormLabel>
              <div
                className="w-full py-6 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-32 object-contain mb-4 rounded shadow-sm"
                  />
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div className="flex items-center text-[#3838F0] text-sm">
                  <UploadCloud className="mr-2 h-5 w-5" />
                  {previewUrl ? "Click to replace image" : "Click to upload image"}
                </div>
              </div>
            </FormItem>

            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}