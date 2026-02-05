"use client";

import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-toastify";
import { 
  Plus,
  X,
  Minus,
  Edit,
  Package,
  Tag,
  DollarSign,
  ListChecks,
  CirclePlus,
  CircleMinus
} from "lucide-react";
import { Feature, SubscriptionPackage } from "@/@types/types"
//import { useStore } from "@/store/store";

// Static data for migration
const staticPremiumFeatures: Feature[] = [
  {
    _id: "1",
    name: "User Management",
    type: "item",
    minQty: 1,
    maxQty: 10,
    price: 100,
    description: "Manage user accounts and permissions"
  },
  {
    _id: "2",
    name: "Storage Space",
    type: "item",
    minQty: 10,
    maxQty: 1000,
    price: 50,
    description: "Cloud storage in GB"
  },
  {
    _id: "3",
    name: "API Calls",
    type: "item",
    minQty: 100,
    maxQty: 10000,
    price: 0.10,
    description: "API calls per month"
  },
  {
    _id: "4",
    name: "Priority Support",
    type: "extra",
    minQty: 0,
    maxQty: 1,
    price: 200,
    description: "24/7 priority support"
  },
  {
    _id: "5",
    name: "Custom Branding",
    type: "extra",
    minQty: 0,
    maxQty: 1,
    price: 150,
    description: "White-label solution"
  },
  {
    _id: "6",
    name: "Training Sessions",
    type: "extra",
    minQty: 0,
    maxQty: 10,
    price: 300,
    description: "One-on-one training sessions"
  }
];

const staticPackageData: SubscriptionPackage = {
  _id: "package_1",
  name: "Premium Plan",
  subtitle: "For growing businesses",
  basePriceMin: 500,
  basePriceMax: 2000,
  minItems: 2,
  benefits: [
    "24/7 Customer Support",
    "99.9% Uptime SLA",
    "Monthly Analytics Report"
  ],
  features: [
    {
      _id: "1",
      name: "User Management",
      type: "item",
      minQty: 5,
      maxQty: 50,
      customPrice: 100
    },
    {
      _id: "2",
      name: "Storage Space",
      type: "item",
      minQty: 100,
      maxQty: 500,
      customPrice: 50
    },
    {
      _id: "4",
      name: "Priority Support",
      type: "extra",
      minQty: 1,
      maxQty: 1,
      customPrice: 200
    }
  ]
};

interface EditPackageProps {
  packageId: string;
  onUpdate?: () => void;
}

export default function EditPackage({ packageId, onUpdate }: EditPackageProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [packageTitle, setPackageTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [items, setItems] = useState<Feature[]>([]);
  const [extras, setExtras] = useState<Feature[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [minItems, setMinItems] = useState(1);
  const [basePriceMin, setBasePriceMin] = useState<number>(0);
  const [basePriceMax, setBasePriceMax] = useState<number>(0);
  
  // Available features state
  const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([]);
  
  // Get user from store
  //const user = useStore((state:any) => state.auth.user);

  // Initialize data when modal opens
  useEffect(() => {
    if (open) {
      // TODO: Replace with API calls
      // const fetchData = async () => {
      //   try {
      //     // Fetch package data
      //     // const packageData = await fetch(`/api/subscriptions/${packageId}`).then(res => res.json());
      //     
      //     // Fetch all features
      //     // const features = await fetch('/api/features').then(res => res.json());
      //   } catch (error) {
      //     console.error("Failed to fetch data:", error);
      //   }
      // };
      // fetchData();
      
      // Static implementation
      const packageData = staticPackageData;
      const allFeatures = staticPremiumFeatures;
      
      setPackageTitle(packageData.name);
      setSubtitle(packageData.subtitle || "");
      setBasePriceMin(packageData.basePriceMin || 0);
      setBasePriceMax(packageData.basePriceMax || 0);
      setMinItems(packageData.minItems || 1);
      setBenefits(packageData.benefits || []);
      
      // Separate items and extras
      const fetchedItems = packageData.features?.filter((f:any) => f.type === "item") || [];
      const fetchedExtras = packageData.features?.filter((f:any) => f.type === "extra") || [];
      
      setItems(fetchedItems);
      setExtras(fetchedExtras);
      
      // Set available features (excluding already used ones)
      const usedFeatureIds = [...fetchedItems, ...fetchedExtras].map(f => f._id);
      const available = allFeatures.filter(f => !usedFeatureIds.includes(f._id));
      setAvailableFeatures(available);
      
      // Calculate initial price
      calculatePrice([...fetchedItems, ...fetchedExtras]);
    }
  }, [open, packageId]);

  const calculatePrice = (features: Feature[]) => {
    let sumMin = 0;
    let sumMax = 0;

    features.forEach((feature) => {
      if (feature.type === "item") {
        const price = feature.customPrice || feature.price || 0;
        sumMin += (feature.minQty || 0) * price;
        sumMax += (feature.maxQty || 0) * price;
      }
    });

    setBasePriceMin(sumMin);
    setBasePriceMax(sumMax);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setPackageTitle("");
    setSubtitle("");
    setItems([]);
    setExtras([]);
    setBenefits([]);
    setMinItems(1);
    setBasePriceMin(0);
    setBasePriceMax(0);
    setAvailableFeatures(staticPremiumFeatures);
  };

  const handleRemoveFeature = (
    index: number,
    list: Feature[],
    type: "items" | "extras"
  ) => {
    const updatedList = [...list];
    const removedFeature = updatedList.splice(index, 1)[0];
    
    // Add back to available features
    if (removedFeature._id !== "select") {
      const originalFeature = staticPremiumFeatures.find(f => f._id === removedFeature._id);
      if (originalFeature) {
        setAvailableFeatures(prev => [...prev, originalFeature]);
      }
    }
    
    if (type === "items") {
      setItems(updatedList);
      calculatePrice([...updatedList, ...extras]);
    } else {
      setExtras(updatedList);
    }
  };

  const handleAddBenefit = () => {
    setBenefits([...benefits, ""]);
  };

  const handleUpdateBenefit = (index: number, value: string) => {
    const updatedBenefits = [...benefits];
    updatedBenefits[index] = value;
    setBenefits(updatedBenefits);
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, idx) => idx !== index));
  };

  const handleAddFeature = (type: "items" | "extras") => {
    const newFeature: Feature = {
      _id: `new_${Date.now()}`,
      name: "",
      type: type === "items" ? "item" : "extra",
      minQty: 1,
      maxQty: type === "items" ? 10 : 1,
      customPrice: 0
    };
    
    if (type === "items") {
      setItems([...items, newFeature]);
    } else {
      setExtras([...extras, newFeature]);
    }
  };

  const handleFeatureChange = (
    index: number,
    field: keyof Feature,
    value: string | number,
    type: "items" | "extras"
  ) => {
    const updateList = type === "items" ? [...items] : [...extras];
    
    if (field === "_id" && value !== "select") {
      // Feature selection changed
      const selectedFeature = availableFeatures.find(f => f._id === value);
      if (selectedFeature) {
        updateList[index] = {
          ...selectedFeature,
          customPrice: selectedFeature.price || 0,
          minQty: selectedFeature.minQty || 1,
          maxQty: selectedFeature.maxQty || 10
        };
        
        // Remove from available features
        setAvailableFeatures(prev => prev.filter(f => f._id !== value));
      }
    } else {
      // Other field changed
      updateList[index] = {
        ...updateList[index],
        [field]: field === "name" ? value : Number(value)
      };
    }
    
    if (type === "items") {
      setItems(updateList);
      calculatePrice([...updateList, ...extras]);
    } else {
      setExtras(updateList);
    }
  };

  const handleUpdatePackage = async () => {
    if (!packageTitle.trim()) {
      toast.error("Package title is required");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Uncomment for API integration
      /*
      const payload = {
        name: packageTitle,
        subtitle: subtitle || undefined,
        basePriceMin,
        basePriceMax,
        benefits: benefits.filter(b => b.trim() !== ""),
        minItems,
        features: [
          ...items.map(item => ({
            _id: item._id,
            minQty: item.minQty,
            maxQty: item.maxQty,
            customPrice: item.customPrice,
            type: "item"
          })),
          ...extras.map(extra => ({
            _id: extra._id,
            minQty: extra.minQty,
            maxQty: extra.maxQty,
            customPrice: extra.customPrice,
            type: "extra"
          }))
        ]
      };

      const response = await fetch(`/api/subscriptions/${packageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to update package');

      // Add notification
      // await fetch('/api/notifications', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     title: "Subscription package updated",
      //     description: `Package "${packageTitle}" was updated`,
      //     status: "unread",
      //     userId: user?._id
      //   }),
      //   credentials: 'include',
      // });
      */

      // Static implementation
      console.log("Updating package:", {
        name: packageTitle,
        subtitle,
        basePriceMin,
        basePriceMax,
        benefits,
        minItems,
        items,
        extras
      });

      toast.success("Package updated successfully! (static mode)");
      handleClose();
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update package:", error);
      toast.error("Failed to update package");
    } finally {
      setIsLoading(false);
    }
  };

  // Render quantity controls
  const renderQuantityControls = (
    value: number,
    onIncrement: () => void,
    onDecrement: () => void,
    onChange: (value: number) => void
  ) => (
    <div className="flex items-center border rounded-md overflow-hidden">
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 text-center border-0 rounded-none focus-visible:ring-0"
        min={0}
      />
      <div className="flex flex-col border-l">
        <button
          type="button"
          onClick={onIncrement}
          className="p-1 hover:bg-gray-100 border-b"
        >
          <Plus className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onDecrement}
          className="p-1 hover:bg-gray-100"
          disabled={value <= 0}
        >
          <Minus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Button
        onClick={handleOpen}
        className="bg-[#3838F0] hover:bg-[#2a2ac7] text-white"
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit Package
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Edit Subscription Package
            </DialogTitle>
            <DialogDescription>
              Modify the subscription package details and features
            </DialogDescription>
          </DialogHeader>

          {/* Basic Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="packageTitle">Package Title *</Label>
                  <Input
                    id="packageTitle"
                    value={packageTitle}
                    onChange={(e) => setPackageTitle(e.target.value)}
                    placeholder="Enter package title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Enter subtitle"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ListChecks className="h-5 w-5" />
                  Items
                </h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor="minItems" className="text-sm">Minimum Items:</Label>
                  <Select value={minItems.toString()} onValueChange={(v) => setMinItems(Number(v))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Items Header */}
              <div className="grid grid-cols-12 gap-2 mb-3 text-sm font-semibold text-gray-600">
                <div className="col-span-1"></div>
                <div className="col-span-5">Feature</div>
                <div className="col-span-2">Min Qty</div>
                <div className="col-span-2">Max Qty</div>
                <div className="col-span-2">Price (£)</div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFeature(index, items, "items")}
                      className="col-span-1"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                    
                    <div className="col-span-5">
                      <Select
                        value={item._id}
                        onValueChange={(value) => handleFeatureChange(index, "_id", value, "items")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select feature">
                            {item.name || "Select feature"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="select">Select a feature</SelectItem>
                          {availableFeatures.map((feature) => (
                            <SelectItem key={feature._id} value={feature._id}>
                              {feature.name} - £{feature.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      {renderQuantityControls(
                        item.minQty || 1,
                        () => handleFeatureChange(index, "minQty", (item.minQty || 0) + 1, "items"),
                        () => handleFeatureChange(index, "minQty", Math.max(0, (item.minQty || 1) - 1), "items"),
                        (value) => handleFeatureChange(index, "minQty", value, "items")
                      )}
                    </div>

                    <div className="col-span-2">
                      {renderQuantityControls(
                        item.maxQty || 10,
                        () => handleFeatureChange(index, "maxQty", (item.maxQty || 10) + 1, "items"),
                        () => handleFeatureChange(index, "maxQty", Math.max(item.minQty || 1, (item.maxQty || 10) - 1), "items"),
                        (value) => handleFeatureChange(index, "maxQty", value, "items")
                      )}
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.customPrice || 0}
                        onChange={(e) => handleFeatureChange(index, "customPrice", Number(e.target.value), "items")}
                        className="w-full"
                        min={0}
                        step="0.01"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddFeature("items")}
                className="mt-4 w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Price Display */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label className="text-lg">Price Range</Label>
                <div className="bg-[#F0F0FF] rounded-lg p-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <DollarSign className="h-6 w-6 text-[#000080]" />
                      <span className="text-2xl font-bold text-[#000080]">
                        £{basePriceMin.toFixed(2)} - £{basePriceMax.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Calculated based on selected items
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Benefits
              </h3>
              
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={benefit}
                      onChange={(e) => handleUpdateBenefit(index, e.target.value)}
                      placeholder="Enter benefit"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveBenefit(index)}
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddBenefit}
                className="mt-4 w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Benefit
              </Button>
            </CardContent>
          </Card>

          {/* Extras Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CirclePlus className="h-5 w-5" />
                  Extras
                </h3>
                <span className="text-sm text-gray-600">
                  {extras.length > 0 ? `${extras.length} extras` : 'No extras'}
                </span>
              </div>

              {/* Extras Header */}
              <div className="grid grid-cols-12 gap-2 mb-3 text-sm font-semibold text-gray-600">
                <div className="col-span-1"></div>
                <div className="col-span-5">Feature</div>
                <div className="col-span-2">Min Qty</div>
                <div className="col-span-2">Max Qty</div>
                <div className="col-span-2">Price (£)</div>
              </div>

              {/* Extras List */}
              <div className="space-y-4">
                {extras.map((extra, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFeature(index, extras, "extras")}
                      className="col-span-1"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                    
                    <div className="col-span-5">
                      <Select
                        value={extra._id}
                        onValueChange={(value) => handleFeatureChange(index, "_id", value, "extras")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select extra">
                            {extra.name || "Select extra"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="select">Select an extra</SelectItem>
                          {availableFeatures.map((feature) => (
                            <SelectItem key={feature._id} value={feature._id}>
                              {feature.name} - £{feature.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      {renderQuantityControls(
                        extra.minQty || 0,
                        () => handleFeatureChange(index, "minQty", (extra.minQty || 0) + 1, "extras"),
                        () => handleFeatureChange(index, "minQty", Math.max(0, (extra.minQty || 0) - 1), "extras"),
                        (value) => handleFeatureChange(index, "minQty", value, "extras")
                      )}
                    </div>

                    <div className="col-span-2">
                      {renderQuantityControls(
                        extra.maxQty || 1,
                        () => handleFeatureChange(index, "maxQty", (extra.maxQty || 1) + 1, "extras"),
                        () => handleFeatureChange(index, "maxQty", Math.max(extra.minQty || 0, (extra.maxQty || 1) - 1), "extras"),
                        (value) => handleFeatureChange(index, "maxQty", value, "extras")
                      )}
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={extra.customPrice || 0}
                        onChange={(e) => handleFeatureChange(index, "customPrice", Number(e.target.value), "extras")}
                        className="w-full"
                        min={0}
                        step="0.01"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddFeature("extras")}
                className="mt-4 w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Extra
              </Button>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdatePackage}
              disabled={isLoading || !packageTitle.trim()}
              className="bg-[#3838F0] hover:bg-[#2a2ac7]"
            >
              {isLoading ? "Updating..." : "Update Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}