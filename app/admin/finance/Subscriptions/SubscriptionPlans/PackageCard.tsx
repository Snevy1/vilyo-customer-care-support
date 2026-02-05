"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Plus,
  Minus,
  X,
  Package,
  Tag,
  DollarSign,
  ListChecks,
  CirclePlus
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteSubscription from "../DeleteSubscription";
import EditPackage from "../Edit"
import { PackageFeature } from "@/@types/types"; 

interface PackageCardProps {
  packageData: {
    _id: string;
    name: string;
    subtitle?: string;
    basePriceMin?: number;
    basePriceMax?: number;
    minItems?: number;
    benefits?: string[];
    features: PackageFeature[];
  };
}

const PackageCard: React.FC<PackageCardProps> = ({ packageData }) => {
  const [isBenefitsVisible, setIsBenefitsVisible] = useState(true);
  const [features, setFeatures] = useState(packageData.features);

  const handleIncrease = (featureName: string) => {
    setFeatures((prev) =>
      prev.map((item) => {
        const name = item.name || item._id?.name || "";
        const currentQty = item.qty || 1;
        const maxQty = item.maxQty || 10;
        
        return name === featureName && currentQty < maxQty
          ? { ...item, qty: currentQty + 1 }
          : item;
      })
    );
  };

  const handleDecrease = (featureName: string) => {
    setFeatures((prev) =>
      prev.map((item) => {
        const name = item.name || item._id?.name || "";
        const currentQty = item.qty || 1;
        const minQty = item.minQty || 1;
        
        return name === featureName && currentQty > minQty
          ? { ...item, qty: currentQty - 1 }
          : item;
      })
    );
  };

  const handleDeleteSuccess = () => {
    console.log("Package deleted successfully");
  };

  const handleUpdateSuccess = () => {
    console.log("Package updated successfully");
  };

  const items = features.filter(item => {
    const type = item.type || item._id?.type;
    return type === "item";
  });

  const extras = features.filter(item => {
    const type = item.type || item._id?.type;
    return type === "extra";
  });

  const benefits = packageData.benefits || [];

  const calculateItemPrice = (item: PackageFeature) => {
    const price = item.customPrice || item._id?.price || item.price || 0;
    const qty = item.qty || 1;
    return (price * qty).toFixed(2);
  };

  return (
    <Card className="border-gray-300 shadow-md w-full max-w-112.5 mx-auto overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-[#000080] text-white p-6 space-y-2">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <div>
            <h3 className="text-2xl font-bold">{packageData.name}</h3>
            {packageData.subtitle && (
              <p className="text-gray-200 text-sm">{packageData.subtitle}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="h-5 w-5" />
            <h4 className="text-lg font-semibold">Included Items</h4>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const name = item.name || item._id?.name || `Item ${index + 1}`;
              
              return (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-lg"
                >
                  {/* Item Name */}
                  <div className="col-span-7">
                    <span className="text-sm font-medium text-gray-800">
                      {name}
                    </span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="col-span-3 flex justify-center">
                    <div className="flex items-center border border-[#6666b3] rounded-md overflow-hidden">
                      <input
                        type="number"
                        value={item.qty || 1}
                        readOnly
                        className="w-10 text-center border-0 focus:outline-none bg-transparent text-sm"
                      />
                      <div className="flex flex-col border-l border-[#6666b3]">
                        <button
                          type="button"
                          onClick={() => handleIncrease(name)}
                          className="p-1 hover:bg-[#6666b3] hover:text-white transition-colors border-b border-[#6666b3]"
                        >
                          <Plus className="h-2 w-2" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecrease(name)}
                          className="p-1 hover:bg-[#6666b3] hover:text-white transition-colors"
                          disabled={(item.qty || 1) <= (item.minQty || 1)}
                        >
                          <Minus className="h-2 w-2" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-semibold text-gray-800">
                      £{calculateItemPrice(item)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits Section */}
        {benefits.length > 0 && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setIsBenefitsVisible(!isBenefitsVisible)}
              className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                <h4 className="font-semibold">Other Benefits</h4>
              </div>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  isBenefitsVisible ? "rotate-180" : ""
                }`}
              />
            </button>

            {isBenefitsVisible && (
              <div className="space-y-3 pl-8">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="bg-[#6666B3] text-white p-3 rounded-lg"
                  >
                    <p className="text-sm">{benefit}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Price Display */}
        <div className="bg-[#F0F0FF] p-4 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2">
            <DollarSign className="h-5 w-5 text-[#000080]" />
            <span className="text-xl font-bold text-[#000080]">
              {packageData.basePriceMax === 0 ? (
                "Free"
              ) : (
                `Starting at £${(packageData.basePriceMin || 0).toFixed(2)}`
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <DeleteSubscription 
            subscriptionPackageId={packageData._id}
            onDelete={handleDeleteSuccess}
          />
          <EditPackage 
            packageId={packageData._id}
            onUpdate={handleUpdateSuccess}
          />
        </div>

        {/* Extras Section */}
        {extras.length > 0 && (
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center gap-2">
              <CirclePlus className="h-5 w-5 text-[#6666B3]" />
              <h3 className="font-semibold text-[#6666B3]">Extras</h3>
            </div>

            <div className="space-y-3">
              {extras.map((item, index) => {
                const name = item.name || item._id?.name || `Extra ${index + 1}`;
                
                return (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-lg"
                  >
                    {/* Item Name */}
                    <div className="col-span-7">
                      <span className="text-sm font-medium text-gray-800">
                        {name}
                      </span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="col-span-3 flex justify-center">
                      <div className="flex items-center border border-[#6666b3] rounded-md overflow-hidden">
                        <input
                          type="number"
                          value={item.qty || 1}
                          readOnly
                          className="w-10 text-center border-0 focus:outline-none bg-transparent text-sm"
                        />
                        <div className="flex flex-col border-l border-[#6666b3]">
                          <button
                            type="button"
                            onClick={() => handleIncrease(name)}
                            className="p-1 hover:bg-[#6666b3] hover:text-white transition-colors border-b border-[#6666b3]"
                          >
                            <Plus className="h-2 w-2" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecrease(name)}
                            className="p-1 hover:bg-[#6666b3] hover:text-white transition-colors"
                            disabled={(item.qty || 1) <= (item.minQty || 1)}
                          >
                            <Minus className="h-2 w-2" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-semibold text-gray-800">
                        £{calculateItemPrice(item)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PackageCard;