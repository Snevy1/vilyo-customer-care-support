"use client";

import { UploadCloud, Eye, EyeOff, Shield, Zap, Globe, ChevronDown, X, Check, AlertCircle } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentProcessorData {
  id: string;
  name: string;
  code: string;
  provider: string;
  environment: "production" | "test";
  logoUrl?: string;
  isEnabled?: boolean;
  supportedCurrencies?: string[];
  // Raw (decrypted) credential fields — only populated when editing
  publicKey?: string;
  secretKey?: string;
  webhookSecretKey?: string;
  customerPortalLink?: string;
  userTypes?: string[] | string;
  orgTypes?: string[] | string;
}

interface ViewEditProps {
  data: PaymentProcessorData;
  onSuccess?: () => void;
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    code: z.string().min(1, "Code is required"),
    provider: z.string().min(1, "Provider is required"),
    environment: z.enum(["production", "test"]),
    isEnabled: z.boolean(),
    publicKey: z.string().optional(),
    secretKey: z.string().optional(),
    webhookSecretKey: z.string().optional(),
    customerPortalLink: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.startsWith("https://"),
        "Must be a valid https:// URL"
      ),
    userTypes: z.array(z.string()).optional(),
    orgTypes: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // At least one credential required for stripe/paypal
      if (["stripe", "paypal"].includes(data.provider.toLowerCase())) {
        return !!data.publicKey || !!data.secretKey;
      }
      return true;
    },
    {
      message: "At least one credential (Public Key or Secret Key) is required",
      path: ["publicKey"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROVIDER_OPTIONS = [
  { value: "stripe", label: "Stripe", icon: "⚡" },
  { value: "paypal", label: "PayPal", icon: "🅿" },
  { value: "mpesa", label: "M-Pesa", icon: "📱" },
  { value: "paystack", label: "Paystack", icon: "💳" },
];

const USER_TYPE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "notEmployed", label: "Not Employed" },
  { value: "employed", label: "Employed" },
  { value: "retired", label: "Retired" },
];

const ORG_TYPE_OPTIONS = [
  { value: "soleTrader", label: "Sole Trader" },
  { value: "partnership", label: "Partnership" },
  { value: "llp", label: "LLP" },
  { value: "ltd", label: "Limited Company (Ltd)" },
  { value: "plc", label: "Public Limited Company" },
  { value: "government", label: "Government" },
  { value: "nonProfit", label: "Non-Profit" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SecretInput({
  placeholder,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { placeholder?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        className="pr-10 font-mono text-sm text-zinc-600" 
         
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
        aria-label={visible ? "Hide" : "Show"}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4 text-zinc-600">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-800">{title}</p>
        {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (val: string[]) => void;
  placeholder: string;
}) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  const available = options.filter((o) => !selected.includes(o.value));

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((val) => {
            const label = options.find((o) => o.value === val)?.label ?? val;
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
              >
                {label}
                <button
                  type="button"
                  onClick={() => toggle(val)}
                  className="ml-0.5 rounded-full hover:bg-indigo-100 p-0.5 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
        </div>
      )}
      {available.length > 0 && (
        <Select onValueChange={toggle}>
          <SelectTrigger className="text-sm text-zinc-500">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {available.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {available.length === 0 && selected.length > 0 && (
        <p className="text-xs text-zinc-400">All options selected</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ViewEdit({ data, onSuccess }: ViewEditProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(data.logoUrl ?? "");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaults(data),
  });

  const providerType = form.watch("provider")?.toLowerCase() ?? "";

  // Reset on open
  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(data));
      setPreviewUrl(data.logoUrl ?? "");
      setFile(null);
      setSubmitError(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function buildDefaults(d: PaymentProcessorData): FormValues {
    return {
      name: d.name ?? "",
      code: d.code ?? "",
      provider: d.provider?.toLowerCase() ?? "",
      environment: d.environment ?? "production",
      isEnabled: d.isEnabled ?? false,
      publicKey: d.publicKey ?? "",
      secretKey: d.secretKey ?? "",
      webhookSecretKey: d.webhookSecretKey ?? "",
      customerPortalLink: d.customerPortalLink ?? "",
      userTypes: parseStringOrArray(d.userTypes),
      orgTypes: parseStringOrArray(d.orgTypes),
    };
  }

  function parseStringOrArray(val?: string[] | string): string[] {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return [];
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    if (!uploaded.type.startsWith("image/")) {
      setSubmitError("Only image files are allowed.");
      return;
    }
    if (uploaded.size > 2 * 1024 * 1024) {
      setSubmitError("Image must be under 2 MB.");
      return;
    }
    setFile(uploaded);
    setPreviewUrl(URL.createObjectURL(uploaded));
    setSubmitError(null);
  };

  const handleProviderChange = (value: string) => {
    form.setValue("provider", value);
    form.setValue("publicKey", "");
    form.setValue("secretKey", "");
    form.setValue("webhookSecretKey", "");
    form.setValue("customerPortalLink", "");
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      // 1. If there's a new logo file, upload it first and get the URL back.
      //    Replace this stub with your actual upload logic (e.g. S3, Cloudinary).
      let resolvedLogoUrl = previewUrl;
      if (file) {
        // const formData = new FormData();
        // formData.append("file", file);
        // const res = await fetch("/api/upload", { method: "POST", body: formData });
        // const { url } = await res.json();
        // resolvedLogoUrl = url;
        console.warn("Logo upload not implemented — using object URL as placeholder.");
      }

      // 2. Build credentials object — API will encrypt this.
      const credentials: Record<string, string> = {};
      if (values.publicKey) credentials.publicKey = values.publicKey;
      if (values.secretKey) credentials.secretKey = values.secretKey;
      if (providerType === "stripe") {
        if (values.webhookSecretKey)
          credentials.webhookSecret = values.webhookSecretKey;
        if (values.customerPortalLink)
          credentials.customerPortalLink = values.customerPortalLink;
      }

      // 3. POST to your API route.
      const payload = {
        provider: values.provider,
        code: values.code,
        displayName: values.name,
        logoUrl: resolvedLogoUrl || null,
        environment: values.environment,
        supportedCurrencies: values.userTypes ?? [],
        credentials,
        isEnabled: values.isEnabled,
        userRole: "SUPER_ADMIN", // This is just an example. Adjust based on your actual role management, for now only superAdmin can edit payment processors: "TENANT_ADMIN" .
      };

      const res = await fetch("/api/admin/payment-processors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save processor");
      }

      setOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  };

  const isStripe = providerType === "stripe";
  const isPayPal = providerType === "paypal";
  const showCredentials = isStripe || isPayPal || providerType === "mpesa" || providerType === "paystack";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-50 transition-colors">
          Edit Processor
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-140 max-h-[90vh] overflow-y-auto p-0 gap-0 bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-zinc-100 px-6 pt-6 pb-4 text-zinc-600">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight text-zinc-900">
              Edit Payment Processor
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 mt-0.5">
              Changes are encrypted before storage and take effect immediately.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="divide-y divide-zinc-100 text-zinc-600"
          >
            {/* ── Section 1: Identity ── */}
            <div className="px-6 py-5 space-y-4">
              <SectionHeader
                icon={<Globe size={15} />}
                title="Identity"
                subtitle="Display name, provider and environment"
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs font-medium text-zinc-600 ">
                        Display Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Stripe Production" {...field} className="text-sm text-zinc-800" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-zinc-600">
                        Code
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. stripe_prod" {...field} className="text-sm font-mono text-zinc-600" />
                      </FormControl>
                      <FormMessage className="text-xs text-zinc-600" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-zinc-600">
                        Provider
                      </FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          handleProviderChange(val);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-sm text-zinc-600">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROVIDER_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className="mr-2">{opt.icon}</span>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-zinc-600">
                        Environment
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="production">
                            <span className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                              Production
                            </span>
                          </SelectItem>
                          <SelectItem value="test">
                            <span className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
                              Test
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isEnabled"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-zinc-600">
                        Status
                      </FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === "true")}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">
                            <span className="flex items-center gap-2">
                              <Check size={12} className="text-green-500" />
                              Enabled
                            </span>
                          </SelectItem>
                          <SelectItem value="false">
                            <span className="flex items-center gap-2">
                              <X size={12} className="text-zinc-400" />
                              Disabled
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Section 2: Credentials ── */}
            {showCredentials && (
              <div className="px-6 py-5 space-y-4">
                <SectionHeader
                  icon={<Shield size={15} />}
                  title="Credentials"
                  subtitle="Stored encrypted — never exposed after saving"
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="publicKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-zinc-600">
                          {isStripe ? "Publishable Key" : "Public / Client ID"}
                        </FormLabel>
                        <FormControl>
                          <SecretInput
                            placeholder={isStripe ? "pk_live_…" : "Public key"}
                            {...field}
                           
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="secretKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-zinc-600">
                          {isStripe ? "Secret Key" : isPayPal ? "Client Secret" : "Secret Key"}
                        </FormLabel>
                        <FormControl>
                          <SecretInput
                            placeholder={isStripe ? "sk_live_…" : "Secret key"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                {isStripe && (
                  <div className="grid grid-cols-1 gap-3">
                    <FormField
                      control={form.control}
                      name="webhookSecretKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-zinc-600">
                            Webhook Secret
                          </FormLabel>
                          <FormControl>
                            <SecretInput placeholder="whsec_…" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerPortalLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-zinc-600">
                            Customer Portal Link
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://billing.stripe.com/…"
                              className="text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
                  <Shield size={13} className="text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Keys are AES-256-GCM encrypted before writing to the database and never returned to the client.
                  </p>
                </div>
              </div>
            )}

            {/* ── Section 3: Access Rules ── */}
            <div className="px-6 py-5 space-y-4">
              <SectionHeader
                icon={<Zap size={15} />}
                title="Access Rules"
                subtitle="Which user and org types can use this processor"
              />

              <FormField
                control={form.control}
                name="userTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-zinc-600">
                      User Types
                    </FormLabel>
                    <MultiSelect
                      options={USER_TYPE_OPTIONS}
                      selected={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="Add user type…"
                    />
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orgTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-zinc-600">
                      Organisation Types
                    </FormLabel>
                    <MultiSelect
                      options={ORG_TYPE_OPTIONS}
                      selected={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="Add organisation type…"
                    />
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Section 4: Logo ── */}
            <div className="px-6 py-5 space-y-3">
              <SectionHeader
                icon={<UploadCloud size={15} />}
                title="Logo"
                subtitle="PNG or SVG recommended · max 2 MB"
              />

              <div
                className="group relative w-full rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center py-8 px-4 gap-3">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Logo preview"
                      className="max-h-16 max-w-40 object-contain rounded shadow-sm"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-300">
                      <UploadCloud size={22} />
                    </div>
                  )}
                  <p className="text-xs text-zinc-500 group-hover:text-indigo-600 transition-colors font-medium">
                    {previewUrl ? "Click to replace" : "Click to upload"}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* ── Error Banner ── */}
            {submitError && (
              <div className="mx-6 mb-2 flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700">{submitError}</p>
              </div>
            )}

            {/* ── Footer ── */}
            <div className="sticky bottom-0 bg-white px-6 py-4 flex items-center justify-end gap-2 border-t border-zinc-100">
              <Button
                variant="ghost"
                type="button"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={form.formState.isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-20"
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving…
                  </span>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}