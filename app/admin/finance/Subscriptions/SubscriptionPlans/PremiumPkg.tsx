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
  Crown
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteSubscription from "../DeleteSubscription";
import EditPackage from "../Edit";
import { toast } from "react-toastify";

interface PackageItem {
  id: string;
  type: "item" | "benefit";
  name?: string;
  qty?: number;
  price?: number;
  description?: string;
}

const defaultItems: PackageItem[] = [
  { 
    id: "1", 
    type: "item", 
    name: "AI Generated risk profile", 
    qty: 1, 
    price: 50 
  },
  {
    id: "2",
    type: "item",
    name: "Upload to T&O Standings (Main or Private)",
    qty: 1,
    price: 50,
  },
  {
    id: "3",
    type: "benefit",
    description:
      "Advanced analytics dashboard with real-time insights",
  },
  {
    id: "4",
    type: "benefit",
    description:
      "Priority customer support with 24/7 availability",
  },
  {
    id: "5",
    type: "benefit",
    description: "Custom API integration and webhooks",
  },
];

interface PackageData {
  name: string;
  starting: number;
  desc: string;
  id: string;
}

const PremiumPkg: React.FC = () => {
  const [isBenefitsVisible, setIsBenefitsVisible] = useState(true);
  const [data, setData] = useState<PackageItem[]>(defaultItems);
  
  const pkgdata: PackageData = {
    name: "Premium Package",
    starting: 167,
    desc: "Manage and allow more options for your requirements",
    id: "premium_package_1"
  };

  const handleIncrease = (id: string) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id && item.type === "item"
          ? { 
              ...item, 
              qty: (item.qty || 1) + 1, 
              price: ((item.qty || 1) + 1) * 50 
            }
          : item
      )
    );
  };

  const handleDecrease = (id: string) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id && item.type === "item" && (item.qty || 1) > 1
          ? { 
              ...item, 
              qty: (item.qty || 1) - 1, 
              price: ((item.qty || 1) - 1) * 50 
            }
          : item
      )
    );
  };

  const handleDeleteSuccess = () => {
    toast.success("Premium package deleted successfully! (static mode)");
    console.log("Premium package deleted");
  };

  const handleUpdateSuccess = () => {
    toast.success("Premium package updated successfully! (static mode)");
    console.log("Premium package updated");
  };

  const items = data.filter(item => item.type === "item");
  const benefits = data.filter(item => item.type === "benefit");

  return (
    <Card className="border-gray-300 shadow-md w-full overflow-hidden">
      {/* Package Header */}
      <CardHeader className="bg-gradient-to-r from-[#000080] to-[#1a1a8a] text-white p-6 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-400" />
            <h3 className="text-2xl font-bold">{pkgdata.name}</h3>
          </div>
          <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Premium
          </span>
        </div>
        <p className="text-gray-200">{pkgdata.desc}</p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="h-5 w-5" />
            <h4 className="text-lg font-semibold">Premium Features</h4>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-3 gap-4 items-center bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200"
              >
                {/* Item Name */}
                <div className="col-span-2">
                  <span className="font-medium text-gray-800">
                    {item.name}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="flex justify-end">
                  <div className="flex items-center border border-[#6666b3] rounded-md overflow-hidden">
                    <input
                      type="number"
                      value={item.qty || 1}
                      readOnly
                      className="w-12 text-center border-0 focus:outline-none bg-transparent"
                    />
                    <div className="flex flex-col border-l border-[#6666b3]">
                      <button
                        type="button"
                        onClick={() => handleIncrease(item.id)}
                        className="p-1 hover:bg-[#6666b3] hover:text-white transition-colors border-b border-[#6666b3]"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecrease(item.id)}
                        className="p-1 hover:bg-[#6666b3] hover:text-white transition-colors"
                        disabled={(item.qty || 1) <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
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
            className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-gray-100 hover:to-gray-200 transition-all border border-gray-200"
          >
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-[#000080]" />
              <h4 className="font-semibold text-[#000080]">Premium Benefits</h4>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-[#000080] transition-transform ${
                isBenefitsVisible ? "rotate-180" : ""
              }`}
            />
          </button>

          {isBenefitsVisible && (
            <div className="space-y-3 pl-8">
              {benefits.map((benefit) => (
                <div
                  key={benefit.id}
                  className="bg-gradient-to-r from-[#6666B3] to-[#7a7ac7] text-white p-4 rounded-lg shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-1">
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                    </div>
                    <p className="text-sm">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price Display */}
        <div className="bg-gradient-to-r from-[#F0F0FF] to-[#e6e6ff] p-6 rounded-lg text-center border border-[#d6d6ff]">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-[#000080]" />
              <span className="text-2xl font-bold text-[#000080]">
                Starting at £{pkgdata.starting.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-600">Monthly subscription</p>
            <p className="text-xs text-gray-500">(All premium features included)</p>
          </div>
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
      </CardContent>
    </Card>
  );
};

export default PremiumPkg;