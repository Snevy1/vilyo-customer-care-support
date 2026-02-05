"use client";

import React, { useEffect, useState, useRef } from "react";
import { CloudUpload } from "lucide-react";

// Shadcn imports — add these if missing:
// npx shadcn@latest add card scroll-area form input label button separator
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// import {
//   useGetAllPaymentProcessorsQuery,
//   useUpdatePaymentProcessorMutation,
// } from "@/store/payments/payment-processor-api";

interface PaymentProcessor {
  _id: string;
  name: string;
  apiKey: string;
  secretKey: string;
  authKey: string;
  logoUrl: string;
}

const formSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  secretKey: z.string().min(1, "Secret Key is required"),
  authKey: z.string().min(1, "Auth Key is required"),
});

type FormValues = z.infer<typeof formSchema>;

const ViewPaymentProcessor = () => {
  const [selectedProcessor, setSelectedProcessor] = useState<PaymentProcessor | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // const { data: allProcessors, isLoading: isAllLoading, isError: isAllError } = useGetAllPaymentProcessorsQuery();
  // const [updatePaymentProcessor, { isLoading: isUpdating }] = useUpdatePaymentProcessorMutation();

  // Mock static data (replace with real query when uncommenting)
  const mockProcessors: PaymentProcessor[] = [
    {
      _id: "1",
      name: "Stripe",
      apiKey: "pk_test_xxx",
      secretKey: "sk_test_xxx",
      authKey: "whsec_xxx",
      logoUrl: "https://example.com/stripe-logo.png",
    },
    {
      _id: "2",
      name: "PayPal",
      apiKey: "paypal_api_xxx",
      secretKey: "paypal_secret_xxx",
      authKey: "paypal_auth_xxx",
      logoUrl: "https://example.com/paypal-logo.png",
    },
    {
      _id: "3",
      name: "M-Pesa",
      apiKey: "mpesa_api_xxx",
      secretKey: "mpesa_secret_xxx",
      authKey: "mpesa_auth_xxx",
      logoUrl: "https://example.com/mpesa-logo.png",
    },
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
      secretKey: "",
      authKey: "",
    },
  });

  useEffect(() => {
    if (selectedProcessor) {
      form.reset({
        apiKey: selectedProcessor.apiKey || "",
        secretKey: selectedProcessor.secretKey || "",
        authKey: selectedProcessor.authKey || "",
      });
      setPreviewUrl(selectedProcessor.logoUrl);
    }
  }, [selectedProcessor, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      console.error("Only image files allowed");
      return;
    }
    const newPreview = URL.createObjectURL(file);
    setPreviewUrl(newPreview);
    console.log("New logo selected (local preview only)");
    // When dynamic: upload file → get new URL → update processor
  };

  const onSubmit = async (values: FormValues) => {
    if (!selectedProcessor) return;

    // try {
    //   await updatePaymentProcessor({
    //     id: selectedProcessor._id,
    //     updates: values,
    //   }).unwrap();
    //   console.log("Updated successfully");
    // } catch (err) {
    //   console.error("Update failed");
    // }

    // Local simulation
    console.log("Updated processor (local only):", {
      ...selectedProcessor,
      ...values,
      logoUrl: previewUrl || selectedProcessor.logoUrl,
    });
  };

  // if (isAllLoading) return <div className="p-10 text-center">Loading...</div>;
  // if (isAllError) return <div className="p-10 text-center text-red-500">Error fetching data.</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm mx-5 my-5 flex flex-col">
      <h1 className="p-5 text-2xl font-semibold text-start border-b">
        View Payment Processor
      </h1>

      <div className="flex flex-col md:flex-row h-full">
        {/* Left: List of processors */}
        <div className="w-full md:w-1/3 border-r p-4">
          <ScrollArea className="h-125 pr-4">
            <div className="space-y-2">
              {mockProcessors.map((processor) => (
                <Card
                  key={processor._id}
                  className={`cursor-pointer transition-colors hover:bg-blue-50 ${
                    selectedProcessor?._id === processor._id ? "bg-blue-50 border-blue-300" : ""
                  }`}
                  onClick={() => setSelectedProcessor(processor)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <img
                      src={processor.logoUrl}
                      alt={`${processor.name} Logo`}
                      className="h-12 w-12 object-contain rounded"
                    />
                    <div>
                      <h3 className="font-medium">{processor.name}</h3>
                      <p className="text-sm text-muted-foreground truncate max-w-45">
                        API: {processor.apiKey}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Selected processor details */}
        {selectedProcessor && (
          <div className="flex-1 p-6 flex flex-col items-center">
            <img
              src={previewUrl || selectedProcessor.logoUrl}
              alt={`${selectedProcessor.name} Logo`}
              className="h-20 object-contain mb-6 rounded shadow-sm"
            />

            {/* Replace Image */}
            <div
              className="w-full max-w-md py-4 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition mb-8"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="flex items-center text-[#3838F0] text-sm">
                <CloudUpload className="mr-2 h-5 w-5" />
                Click to replace image
              </div>
            </div>

            <h2 className="text-xl font-bold mb-6">{selectedProcessor.name}</h2>

            <Separator className="mb-6" />

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md space-y-5">
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

                <div className="flex justify-center mt-8">
                  <Button
                    type="submit"
                    className="bg-[#3838F0] hover:bg-[#2a2ad8] px-8"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Updating..." : "Update"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {!selectedProcessor && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a payment processor from the list to view and edit details.
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewPaymentProcessor;