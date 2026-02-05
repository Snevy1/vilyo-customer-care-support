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
  ListChecks
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteSubscription from "../DeleteSubscription";
import EditPackage from "../Edit";

interface PackageItem {
  id: number;
  type: "item" | "benefit" | "extra";
  name?: string;
  qty?: number;
  price?: number;
  description?: string;
}

const initialItems: PackageItem[] = [
  { id: 1, type: "item", name: "AI Generated risk profile", qty: 1, price: 4 },
  {
    id: 2,
    type: "item",
    name: "Upload to T&O Standings (Main or Private)",
    qty: 1,
    price: 4,
  },
  {
    id: 3,
    type: "benefit",
    description:
      "Interact with our T&O standings such as vote risk up/down, like and comment.",
  },
  {
    id: 4,
    type: "benefit",
    description:
      "Refer others to join and participate through our referral channel.",
  },
  {
    id: 5,
    type: "benefit",
    description: "Manage risks you have added to the T&O standings",
  },
  {
    id: 6,
    type: "extra",
    name: "AI Generated risk profile",
    qty: 1,
    price: 4,
  },
];

interface PackageData {
  name: string;
  starting: number;
  desc: string;
  id: string;
}

const StandardPkg: React.FC = () => {
  const [data, setData] = useState<PackageItem[]>(initialItems);
  const [isBenefitsVisible, setIsBenefitsVisible] = useState(true);
  
  // Package data
  const pkgdata: PackageData = {
    name: "Standard Package",
    starting: 64.5,
    desc: "Built for the basic requirements",
    id: "standard_package_1"
  };

  const handleIncrease = (id: number) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id && (item.type === "item" || item.type === "extra")
          ? { 
              ...item, 
              qty: (item.qty || 1) + 1, 
              price: ((item.qty || 1) + 1) * 4 
            }
          : item
      )
    );
  };

  const handleDecrease = (id: number) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id &&
        (item.type === "item" || item.type === "extra") &&
        (item.qty || 1) > 1
          ? { 
              ...item, 
              qty: (item.qty || 1) - 1, 
              price: ((item.qty || 1) - 1) * 4 
            }
          : item
      )
    );
  };

  const handleRemoveItem = (id: number) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id && item.type === "item" 
          ? { ...item, type: "extra" } 
          : item
      )
    );
  };

  const handleAddItem = (id: number) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id && item.type === "extra"
          ? { ...item, type: "item" }
          : item
      )
    );
  };

  const handleDeleteSuccess = () => {
    console.log("Package deleted successfully");
    // Refresh data or update UI as needed
  };

  const handleUpdateSuccess = () => {
    console.log("Package updated successfully");
    // Refresh data or update UI as needed
  };

  // Filter items by type
  const items = data.filter(item => item.type === "item");
  const benefits = data.filter(item => item.type === "benefit");
  const extras = data.filter(item => item.type === "extra");

  return (
    <Card className="border-gray-300 shadow-md w-full overflow-hidden">
      {/* Package Header */}
      <CardHeader className="bg-[#000080] text-white p-6 space-y-2">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <h3 className="text-2xl font-bold">{pkgdata.name}</h3>
        </div>
        <p className="text-gray-200">{pkgdata.desc}</p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Items
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm font-semibold text-gray-600">
              <span className="text-center">Item</span>
              <span className="text-center">Qty</span>
              <span className="text-center">Price (£)</span>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-3 gap-4 items-center bg-gray-50 p-3 rounded-lg"
              >
                {/* Item Name with Remove Button */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    className="h-8 w-8 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                  <span className="text-sm font-medium text-gray-800">
                    {item.name}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="flex justify-center">
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <input
                      type="number"
                      value={item.qty || 1}
                      readOnly
                      className="w-12 text-center border-0 focus:outline-none bg-transparent"
                    />
                    <div className="flex flex-col border-l">
                      <button
                        type="button"
                        onClick={() => handleIncrease(item.id)}
                        className="p-1 hover:bg-gray-100 border-b"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecrease(item.id)}
                        className="p-1 hover:bg-gray-100"
                        disabled={(item.qty || 1) <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="text-center">
                  <span className="font-semibold text-gray-800">
                    £{item.price?.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
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
              {benefits.map((benefit) => (
                <div
                  key={benefit.id}
                  className="bg-[#6666B3] text-white p-4 rounded-lg"
                >
                  <p className="text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price Display */}
        <div className="bg-[#F0F0FF] p-6 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="h-6 w-6 text-[#000080]" />
            <span className="text-2xl font-bold text-[#000080]">
              Starting at £{pkgdata.starting.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-gray-600">Monthly subscription</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <DeleteSubscription 
            subscriptionPackageId={pkgdata.id}
            onDelete={handleDeleteSuccess}
          />
          <EditPackage 
            packageId={pkgdata.id}
            onUpdate={handleUpdateSuccess}
          />
        </div>

        {/* Extras Section */}
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#6666B3]" />
            <h3 className="font-semibold text-[#6666B3]">Extras</h3>
          </div>

          {extras.length > 0 ? (
            <div className="space-y-3">
              {extras.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-3 gap-4 items-center bg-gray-50 p-3 rounded-lg"
                >
                  {/* Item Name with Add Button */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAddItem(item.id)}
                      className="h-8 w-8 hover:bg-green-50"
                    >
                      <Plus className="h-4 w-4 text-green-500" />
                    </Button>
                    <span className="text-sm font-medium text-gray-800">
                      {item.name}
                    </span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex justify-center">
                    <div className="flex items-center border rounded-md overflow-hidden">
                      <input
                        type="number"
                        value={item.qty || 1}
                        readOnly
                        className="w-12 text-center border-0 focus:outline-none bg-transparent"
                      />
                      <div className="flex flex-col border-l">
                        <button
                          type="button"
                          onClick={() => handleIncrease(item.id)}
                          className="p-1 hover:bg-gray-100 border-b"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecrease(item.id)}
                          className="p-1 hover:bg-gray-100"
                          disabled={(item.qty || 1) <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-center">
                    <span className="font-semibold text-gray-800">
                      £{item.price?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No extras available for this package</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StandardPkg;