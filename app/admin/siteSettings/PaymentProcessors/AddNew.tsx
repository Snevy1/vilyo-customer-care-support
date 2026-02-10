"use client";

import { Plus, UploadCloud } from "lucide-react";
import React, { useState, useRef } from "react";

// Shadcn imports — add if missing: dialog button input form label separator badge
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// import { useAddPaymentProcessorMutation } from "@/store/payments/payment-processor-api";
// import { useUploadFileMutation } from "@/store/dashboard/file-api";
// import { useAddAdminNotificationMutation } from "@/store/dashboard/admin-notification-api";

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

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider: z.string().min(1, "Provider is required"),
  apiKey: z.string().min(1, "API Key is required"),
  secretKey: z.string().min(1, "Secret Key is required"),
  authKey: z.string().min(1, "Auth Key is required"),
  userTypes: z.array(z.string()).optional(),
  orgTypes: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddNew(/* { onRefetch } */) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // const [createPaymentProcessor, { isLoading: isCreating }] = useAddPaymentProcessorMutation();
  // const [uploadFile] = useUploadFileMutation();
  // const [addNotification] = useAddAdminNotificationMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      provider: "",
      apiKey: "",
      secretKey: "",
      authKey: "",
      userTypes: [],
      orgTypes: [],
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      console.error("Only image files allowed");
      return;
    }
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    console.log("Image selected");
  };

  const onSubmit = async (values: FormValues) => {
    if (!image) {
      console.error("Please upload an image");
      return;
    }

    // const formData = new FormData();
    // formData.append("name", values.name);
    // formData.append("provider", values.provider);
    // formData.append("apiKey", values.apiKey);
    // formData.append("secretKey", values.secretKey);
    // formData.append("authKey", values.authKey);
    // formData.append("userTypes", JSON.stringify(values.userTypes || []));
    // formData.append("orgTypes", JSON.stringify(values.orgTypes || []));
    // formData.append("file", image);

    // try {
    //   // axios.post or RTK mutation here
    //   // await addNotification(...)
    //   console.log("Processor added successfully (real call)");
    //   // onRefetch();
    //   handleCancel();
    // } catch (err) {
    //   console.error("Add failed");
    // }

    // Local simulation
    console.log("Add submitted (local only):", values, "with image");
    setOpen(false);
    form.reset();
    setImage(null);
    setPreviewUrl(null);
  };

  const toggleUserType = (value: string) => {
    const current = form.getValues("userTypes") || [];
    form.setValue(
      "userTypes",
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    );
  };

  const toggleOrgType = (value: string) => {
    const current = form.getValues("orgTypes") || [];
    form.setValue(
      "orgTypes",
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    );
  };

  const handleCancel = () => {
    setOpen(false);
    form.reset();
    setImage(null);
    setPreviewUrl(null);
    // onRefetch();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-400 text-white flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-137.5 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Payment Processor</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new payment processor.
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
                  <FormControl>
                    <Input placeholder="Enter provider (e.g. Stripe)" {...field} />
                  </FormControl>
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
                    <Input placeholder="Enter API Key" {...field} />
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
                    <Input placeholder="Enter Secret Key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auth Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Auth Key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* User Types */}
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

            {/* Org Types */}
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

            {/* Image Upload */}
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
              {!image && <p className="text-sm text-red-500 mt-1">Image is required</p>}
            </FormItem>

            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#3838F0] hover:bg-[#2a2ad8]"
                disabled={form.formState.isSubmitting || !image}
              >
                {form.formState.isSubmitting ? "Processing..." : "Add Processor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}