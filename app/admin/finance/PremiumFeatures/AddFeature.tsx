"use client"

import { PoundSterling } from "lucide-react";
import { useState } from "react";

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// TODO: Uncomment when API is ready
// import { useCreateFeatureMutation, useUpdateFeatureMutation } from "@/store/subscriptions/subscriptions-api";

interface AddFeatureProps {
  data?: {
    _id?: string;
    name?: string;
    price?: number;
    description?: string;
    visibility?: boolean;
    currency?: string;
    interval?: string;
    trial_period_days?: number;
  } | null;
  refetch?: () => void;
}

const AddFeature = ({ data, refetch }: AddFeatureProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(data?.name || "");
  const [description, setDescription] = useState(data?.description || "");
  const [price, setPrice] = useState(data?.price?.toString() || "");
  const [visibility, setVisibility] = useState(data?.visibility ?? true);
  const [currency, setCurrency] = useState(data?.currency || "usd");
  const [interval, setInterval] = useState(data?.interval || "monthly");
  const [trialPeriodDays, setTrialPeriodDays] = useState(
    data?.trial_period_days?.toString() || "0"
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);



  // TODO: Uncomment when API is ready
  // const [createFeature, { isLoading: isCreating }] = useCreateFeatureMutation();
  // const [updateFeature, { isLoading: isUpdating }] = useUpdateFeatureMutation();


  toast.error("Error", {
      description: "Image must be smaller than 5MB",
    });


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Please input the feature name!";
    }
    if (!price.trim()) {
      newErrors.price = "Please input the price!";
    } else if (parseFloat(price) < 0) {
      newErrors.price = "Price cannot be negative!";
    }
    if (!currency) {
      newErrors.currency = "Please select a currency!";
    }
    if (!interval) {
      newErrors.interval = "Please select an interval!";
    }
    if (!trialPeriodDays.trim()) {
      newErrors.trial_period_days = "Please input the trial period days!";
    } else if (parseInt(trialPeriodDays) < 0) {
      newErrors.trial_period_days = "Trial period cannot be negative!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOk = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const payload = {
        name,
        description,
        price: parseFloat(price),
        visibility,
        currency,
        interval,
        trial_period_days: parseInt(trialPeriodDays, 10),
      };

      console.log("Feature payload:", payload);

      // TODO: Uncomment when API is ready
      // if (data?._id) {
      //   await updateFeature({ id: data._id, updates: payload }).unwrap();
      //   toast({
      //     title: "Success",
      //     description: "Feature updated successfully!",
      //   });
      // } else {
      //   await createFeature(payload).unwrap();
      //   toast({
      //     title: "Success",
      //     description: "Feature created successfully!",
      //   });
      // }
      // refetch?.();

      // Static implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Success", {
         description: data?._id
          ? "Feature updated successfully! (static mode)"
          : "Feature created successfully! (static mode)",
        });
      
      refetch?.();

      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating/updating feature:", error);
      toast.error("Error", {
         description: error?.data?.error || error.message || "An error occurred. Please try again.",
        });
      
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    if (!data) {
      setName("");
      setDescription("");
      setPrice("");
      setVisibility(true);
      setCurrency("usd");
      setInterval("monthly");
      setTrialPeriodDays("0");
    }
    setErrors({});
  };

  const handleCancel = () => {
    setOpen(false);
    resetForm();
  };

  // Update form when data changes (for edit mode)
  useState(() => {
    if (open && data) {
      setName(data.name || "");
      setDescription(data.description || "");
      setPrice(data.price?.toString() || "");
      setVisibility(data.visibility ?? true);
      setCurrency(data.currency || "usd");
      setInterval(data.interval || "monthly");
      setTrialPeriodDays(data.trial_period_days?.toString() || "0");
    }
  });

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="rounded-md px-6 py-2 text-white bg-blue-400 flex items-center hover:bg-blue-200 transition-colors">
            {data ? "Edit" : "Add Feature"}
          </button>
        </DialogTrigger>

        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{data ? "Update Feature" : "Add Feature"}</DialogTitle>
          </DialogHeader>

          <Separator className="my-2" />

          <div className="space-y-4 py-2">
            {/* Feature Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Feature Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                disabled={isLoading}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">
                Price <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <PoundSterling
                  size={14}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <Input
                  id="price"
                  type="number"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (errors.price) setErrors({ ...errors, price: "" });
                  }}
                  disabled={isLoading}
                  step="0.01"
                  className={`pl-8 ${errors.price ? "border-red-500" : ""}`}
                />
              </div>
              {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="visibility">
                Visibility <span className="text-red-500">*</span>
              </Label>
              <Switch
                id="visibility"
                checked={visibility}
                onCheckedChange={setVisibility}
                disabled={isLoading}
              />
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">
                Currency <span className="text-red-500">*</span>
              </Label>
              <Select value={currency} onValueChange={setCurrency} disabled={isLoading}>
                <SelectTrigger className={errors.currency ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="gbp">GBP</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-sm text-red-500">{errors.currency}</p>
              )}
            </div>

            {/* Interval */}
            <div className="space-y-2">
              <Label htmlFor="interval">
                Interval <span className="text-red-500">*</span>
              </Label>
              <Select value={interval} onValueChange={setInterval} disabled={isLoading}>
                <SelectTrigger className={errors.interval ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              {errors.interval && (
                <p className="text-sm text-red-500">{errors.interval}</p>
              )}
            </div>

            {/* Trial Period Days */}
            <div className="space-y-2">
              <Label htmlFor="trial_period_days">
                Trial Period (Days) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="trial_period_days"
                type="number"
                placeholder="Trial period days"
                value={trialPeriodDays}
                onChange={(e) => {
                  setTrialPeriodDays(e.target.value);
                  if (errors.trial_period_days)
                    setErrors({ ...errors, trial_period_days: "" });
                }}
                disabled={isLoading}
                step="1"
                className={errors.trial_period_days ? "border-red-500" : ""}
              />
              {errors.trial_period_days && (
                <p className="text-sm text-red-500">{errors.trial_period_days}</p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleOk}
              disabled={isLoading}
              className="bg-[#3838F0] hover:bg-[#2a2ac7] text-white"
            >
              {isLoading ? "Saving..." : data ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddFeature;