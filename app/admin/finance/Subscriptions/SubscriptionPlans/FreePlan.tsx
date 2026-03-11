"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Plus,
  Minus,
  Package,
  Tag,
  DollarSign,
  ListChecks,
  Gift
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteSubscription from "../DeleteSubscription";
import EditPackage from "../Edit";
import { toast } from "react-toastify";

interface FreePackageItem {
  id: string;
  type: "item" | "benefit";
  name?: string;
  qty?: number;
  price?: number;
  description?: string;
}

const freeItems: FreePackageItem[] = [
  { 
    id: "1", 
    type: "item", 
    name: "AI Generated risk profile", 
    qty: 1, 
    price: 0 
  },
  {
    id: "2",
    type: "item",
    name: "Upload to T&O Standings (Main or Private)",
    qty: 1,
    price: 0,
  },
  {
    id: "3",
    type: "benefit",
    description:
      "Interact with our T&O standings such as vote risk up/down, like and comment.",
  },
  {
    id: "4",
    type: "benefit",
    description:
      "Refer others to join and participate through our referral channel.",
  },
];

interface PackageData {
  name: string;
  starting: number;
  desc: string;
  id: string;
}

const FreePlan: React.FC = () => {
  const [isBenefitsVisible, setIsBenefitsVisible] = useState(true);
  const [data, setData] = useState<FreePackageItem[]>(freeItems);
  
  const pkgdata: PackageData = {
    name: "Free Plan",
    starting: 0,
    desc: "Trial and upgrade",
    id: "free_plan_1"
  };

  const handleIncrease = (id: string) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id && item.type === "item"
          ? { 
              ...item, 
              qty: (item.qty || 1) + 1
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
              qty: (item.qty || 1) - 1
            }
          : item
      )
    );
  };

  const handleDeleteSuccess = () => {
    toast.success("Free plan deleted successfully! (static mode)");
    console.log("Free plan deleted");
  };

  const handleUpdateSuccess = () => {
    toast.success("Free plan updated successfully! (static mode)");
    console.log("Free plan updated");
  };

  const items = data.filter(item => item.type === "item");
  const benefits = data.filter(item => item.type === "benefit");

  return (
    <Card className="border-gray-300 shadow-md w-full overflow-hidden border-2">
      {/* Package Header */}
      <CardHeader className="bg-linear-to-r from-green-600 to-green-700 text-white p-6 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6" />
            <h3 className="text-2xl font-bold">{pkgdata.name}</h3>
          </div>
          <span className="bg-white text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
            Free Forever
          </span>
        </div>
        <p className="text-gray-200">{pkgdata.desc}</p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="h-5 w-5 text-green-600" />
            <h4 className="text-lg font-semibold text-green-700">Free Features</h4>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-3 gap-4 items-center bg-linear-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200"
              >
                {/* Item Name */}
                <div className="col-span-2">
                  <span className="font-medium text-gray-800">
                    {item.name}
                  </span>
                  <span className="block text-xs text-green-600 mt-1">
                    Included for free
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="flex justify-end">
                  <div className="flex items-center border border-green-400 rounded-md overflow-hidden">
                    <input
                      type="number"
                      value={item.qty || 1}
                      readOnly
                      className="w-12 text-center border-0 focus:outline-none bg-transparent"
                    />
                    <div className="flex flex-col border-l border-green-400">
                      <button
                        type="button"
                        onClick={() => handleIncrease(item.id)}
                        className="p-1 hover:bg-green-400 hover:text-white transition-colors border-b border-green-400"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecrease(item.id)}
                        className="p-1 hover:bg-green-400 hover:text-white transition-colors"
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
            className="flex items-center justify-between w-full p-3 bg-linear-to-r from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all border border-green-200"
          >
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-700">Free Benefits</h4>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-green-600 transition-transform ${
                isBenefitsVisible ? "rotate-180" : ""
              }`}
            />
          </button>

          {isBenefitsVisible && (
            <div className="space-y-3 pl-8">
              {benefits.map((benefit) => (
                <div
                  key={benefit.id}
                  className="bg-linear-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow-sm"
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
        <div className="bg-linear-to-r from-green-100 to-green-200 p-6 rounded-lg text-center border border-green-300">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-green-700" />
              <span className="text-3xl font-bold text-green-800">
                FREE
              </span>
            </div>
            <p className="text-sm text-green-700">No credit card required</p>
            <p className="text-xs text-green-600">Start your free trial today</p>
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

export default FreePlan;