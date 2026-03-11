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
  Star,
  Award
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteSubscription from "../DeleteSubscription";
import EditPackage from "../Edit";
import { toast } from "react-toastify";

interface GoldPackageItem {
  id: string;
  type: "item" | "benefit" | "extra";
  name?: string;
  qty?: number;
  price?: number;
  description?: string;
}

const goldItems: GoldPackageItem[] = [
  { 
    id: "1", 
    type: "item", 
    name: "AI Generated risk profile", 
    qty: 1, 
    price: 100 
  },
  {
    id: "2",
    type: "item",
    name: "Upload to T&O Standings (Main or Private)",
    qty: 1,
    price: 100,
  },
  {
    id: "3",
    type: "benefit",
    description:
      "Exclusive access to premium analytics and insights",
  },
  {
    id: "4",
    type: "benefit",
    description:
      "Dedicated account manager and priority support",
  },
  {
    id: "5",
    type: "benefit",
    description: "Advanced customization and integration options",
  },
  {
    id: "6",
    type: "extra",
    name: "Premium AI Generated risk profile",
    qty: 1,
    price: 200,
  },
];

interface PackageData {
  name: string;
  starting: number;
  desc: string;
  id: string;
}

const GoldPkg: React.FC = () => {
  const [isBenefitsVisible, setIsBenefitsVisible] = useState(true);
  const [data, setData] = useState<GoldPackageItem[]>(goldItems);
  
  const pkgdata: PackageData = {
    name: "Gold Package",
    starting: 203,
    desc: "Comprehensive package to meet your requirements",
    id: "gold_package_1"
  };

  const handleIncrease = (id: string) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id && (item.type === "item" || item.type === "extra")
          ? { 
              ...item, 
              qty: (item.qty || 1) + 1, 
              price: ((item.qty || 1) + 1) * (item.type === "extra" ? 200 : 100)
            }
          : item
      )
    );
  };

  const handleDecrease = (id: string) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id &&
        (item.type === "item" || item.type === "extra") &&
        (item.qty || 1) > 1
          ? { 
              ...item, 
              qty: (item.qty || 1) - 1, 
              price: ((item.qty || 1) - 1) * (item.type === "extra" ? 200 : 100)
            }
          : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id && item.type === "item"
          ? { ...item, type: "extra" }
          : item
      )
    );
  };

  const handleAddItem = (id: string) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id && item.type === "extra"
          ? { ...item, type: "item" }
          : item
      )
    );
  };

  const handleDeleteSuccess = () => {
    toast.success("Gold package deleted successfully! (static mode)");
    console.log("Gold package deleted");
  };

  const handleUpdateSuccess = () => {
    toast.success("Gold package updated successfully! (static mode)");
    console.log("Gold package updated");
  };

  const items = data.filter(item => item.type === "item");
  const benefits = data.filter(item => item.type === "benefit");
  const extras = data.filter(item => item.type === "extra");

  return (
    <Card className="shadow-md w-full overflow-hidden border-2 border-yellow-200">
      {/* Package Header */}
      <CardHeader className="bg-linear-to-r from-yellow-600 to-yellow-700 text-white p-6 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6" />
            <h3 className="text-2xl font-bold">{pkgdata.name}</h3>
          </div>
          <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
        <p className="text-gray-200">{pkgdata.desc}</p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="h-5 w-5 text-yellow-600" />
            <h4 className="text-lg font-semibold text-yellow-700">Gold Features</h4>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 items-center bg-linear-to-r from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200"
              >
                {/* Item Name with Remove Button */}
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    className="h-6 w-6 hover:bg-red-50"
                  >
                    <X className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
                
                <div className="col-span-5">
                  <span className="text-sm font-medium text-gray-800">
                    {item.name}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="col-span-4 flex justify-center">
                  <div className="flex items-center border border-yellow-400 rounded-md overflow-hidden">
                    <input
                      type="number"
                      value={item.qty || 1}
                      readOnly
                      className="w-10 text-center border-0 focus:outline-none bg-transparent text-sm"
                    />
                    <div className="flex flex-col border-l border-yellow-400">
                      <button
                        type="button"
                        onClick={() => handleIncrease(item.id)}
                        className="p-1 hover:bg-yellow-400 hover:text-white transition-colors border-b border-yellow-400"
                      >
                        <Plus className="h-2 w-2" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecrease(item.id)}
                        className="p-1 hover:bg-yellow-400 hover:text-white transition-colors"
                        disabled={(item.qty || 1) <= 1}
                      >
                        <Minus className="h-2 w-2" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-2 text-center">
                  <span className="text-sm font-semibold text-gray-800">
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
            className="flex items-center justify-between w-full p-3 bg-linear-to-r from-yellow-50 to-yellow-100 rounded-lg hover:from-yellow-100 hover:to-yellow-200 transition-all border border-yellow-200"
          >
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-700">Gold Benefits</h4>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-yellow-600 transition-transform ${
                isBenefitsVisible ? "rotate-180" : ""
              }`}
            />
          </button>

          {isBenefitsVisible && (
            <div className="space-y-3 pl-8">
              {benefits.map((benefit) => (
                <div
                  key={benefit.id}
                  className="bg-linear-to-r from-yellow-500 to-yellow-600 text-white p-4 rounded-lg shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-1">
                      <Star className="h-3 w-3" />
                    </div>
                    <p className="text-sm">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price Display */}
        <div className="bg-linear-to-r from-yellow-100 to-yellow-200 p-6 rounded-lg text-center border border-yellow-300">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-yellow-800" />
              <span className="text-2xl font-bold text-yellow-900">
                Starting at £{pkgdata.starting.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-yellow-700">Best value for enterprise</p>
            <p className="text-xs text-yellow-600">(All features + premium extras)</p>
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

        {/* Extras Section */}
        {extras.length > 0 && (
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-700">Gold Extras</h3>
            </div>

            <div className="space-y-3">
              {extras.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-center bg-linear-to-r from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200"
                >
                  {/* Item Name with Add Button */}
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAddItem(item.id)}
                      className="h-6 w-6 hover:bg-green-50"
                    >
                      <Plus className="h-3 w-3 text-green-500" />
                    </Button>
                  </div>
                  
                  <div className="col-span-5">
                    <span className="text-sm font-medium text-gray-800">
                      {item.name}
                    </span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="col-span-4 flex justify-center">
                    <div className="flex items-center border border-yellow-400 rounded-md overflow-hidden">
                      <input
                        type="number"
                        value={item.qty || 1}
                        readOnly
                        className="w-10 text-center border-0 focus:outline-none bg-transparent text-sm"
                      />
                      <div className="flex flex-col border-l border-yellow-400">
                        <button
                          type="button"
                          onClick={() => handleIncrease(item.id)}
                          className="p-1 hover:bg-yellow-400 hover:text-white transition-colors border-b border-yellow-400"
                        >
                          <Plus className="h-2 w-2" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecrease(item.id)}
                          className="p-1 hover:bg-yellow-400 hover:text-white transition-colors"
                          disabled={(item.qty || 1) <= 1}
                        >
                          <Minus className="h-2 w-2" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-semibold text-gray-800">
                      £{item.price?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoldPkg;