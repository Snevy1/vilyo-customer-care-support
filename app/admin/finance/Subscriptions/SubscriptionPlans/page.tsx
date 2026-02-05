"use client";

import React, { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import PackageCard from "./PackageCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { PackageFeature } from "@/@types/types"; 

// Static data for migration
const staticSubscriptionPackages = [
  {
    _id: "free_plan_1",
    name: "Free Plan",
    subtitle: "Trial and upgrade",
    basePriceMin: 0,
    basePriceMax: 0,
    minItems: 2,
    benefits: [
      "Interact with our T&O standings such as vote risk up/down, like and comment.",
      "Refer others to join and participate through our referral channel."
    ],
    features: [
      {
        _id: { name: "AI Generated risk profile", price: 0, type: "item" },
        minQty: 1,
        maxQty: 1,
        customPrice: 0,
        qty: 1,
        type: "item"
      },
      {
        _id: { name: "Upload to T&O Standings", price: 0, type: "item" },
        minQty: 1,
        maxQty: 1,
        customPrice: 0,
        qty: 1,
        type: "item"
      }
    ]
  },
  {
    _id: "standard_package_1",
    name: "Standard Package",
    subtitle: "Built for the basic requirements",
    basePriceMin: 64.5,
    basePriceMax: 64.5,
    minItems: 2,
    benefits: [
      "Interact with our T&O standings",
      "Refer others to join and participate",
      "Manage risks you have added"
    ],
    features: [
      {
        _id: { name: "AI Generated risk profile", price: 4, type: "item" },
        minQty: 1,
        maxQty: 10,
        customPrice: 4,
        qty: 1,
        type: "item"
      },
      {
        _id: { name: "Upload to T&O Standings", price: 4, type: "item" },
        minQty: 1,
        maxQty: 10,
        customPrice: 4,
        qty: 1,
        type: "item"
      }
    ]
  },
  {
    _id: "premium_package_1",
    name: "Premium Package",
    subtitle: "Manage and allow more options",
    basePriceMin: 167,
    basePriceMax: 167,
    minItems: 2,
    benefits: [
      "Advanced analytics dashboard",
      "Priority customer support",
      "Custom API integration"
    ],
    features: [
      {
        _id: { name: "AI Generated risk profile", price: 50, type: "item" },
        minQty: 1,
        maxQty: 20,
        customPrice: 50,
        qty: 1,
        type: "item"
      },
      {
        _id: { name: "Advanced Upload Options", price: 50, type: "item" },
        minQty: 1,
        maxQty: 20,
        customPrice: 50,
        qty: 1,
        type: "item"
      }
    ]
  },
  {
    _id: "gold_package_1",
    name: "Gold Package",
    subtitle: "Comprehensive package",
    basePriceMin: 203,
    basePriceMax: 203,
    minItems: 3,
    benefits: [
      "Exclusive access to premium analytics",
      "Dedicated account manager",
      "Advanced customization options"
    ],
    features: [
      {
        _id: { name: "AI Generated risk profile", price: 100, type: "item" },
        minQty: 1,
        maxQty: 30,
        customPrice: 100,
        qty: 1,
        type: "item"
      },
      {
        _id: { name: "Enterprise Upload Options", price: 100, type: "item" },
        minQty: 1,
        maxQty: 30,
        customPrice: 100,
        qty: 1,
        type: "item"
      },
      {
        _id: { name: "Premium Support", price: 200, type: "extra" },
        minQty: 0,
        maxQty: 1,
        customPrice: 200,
        qty: 0,
        type: "extra"
      }
    ]
  }
];

const SubscriptionPlan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [subscriptionPackages, setSubscriptionPackages] = useState<any[]>([]);

  useEffect(() => {
    // TODO: Replace with API call
    /*
    const fetchPackages = async () => {
      setIsLoading(true);
      try {
        // const response = await fetch('/api/subscriptions');
        // const data = await response.json();
        // setSubscriptionPackages(data);
        
        // Static implementation for now
        setSubscriptionPackages(staticSubscriptionPackages);
      } catch (error) {
        console.error('Error fetching subscription packages:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPackages();
    */
   
    // Static implementation
    setIsLoading(true);
    setTimeout(() => {
      setSubscriptionPackages(staticSubscriptionPackages);
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="pl-[0px]">
        <div className="flex gap-4 p-4 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[300px]">
              <Skeleton className="h-[500px] w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="pl-[0px] p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div>
            <h3 className="font-semibold text-red-700">Error</h3>
            <p className="text-red-600 text-sm">
              Failed to load subscription packages. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pl-[0px]">
      <Carousel className="relative overflow-x-scroll scrollbar-hide max-w-[100vw] md:max-w-[75vw]">
        <CarouselContent className="flex gap-2 md:gap-4 p-2 md:p-4">
          {subscriptionPackages?.map((pkg) => (
            <CarouselItem
              key={pkg._id}
              className="min-w-[250px] sm:min-w-[300px] md:min-w-[350px] lg:min-w-[400px] basis-[90%] sm:basis-[70%] md:basis-[50%] lg:basis-[40%] xl:basis-[30%]"
            >
              <PackageCard
                packageData={{
                  _id: pkg._id,
                  name: pkg.name,
                  subtitle: pkg.subtitle || "No subtitle",
                  basePriceMin: pkg.basePriceMin || 0,
                  basePriceMax: pkg.basePriceMax || 0,
                  minItems: pkg.minItems || 0,
                  benefits: Array.isArray(pkg.benefits) ? pkg.benefits : [],
                  features: Array.isArray(pkg.features)
                    ? pkg.features.map((feature: any) => ({
                        _id: feature._id,
                        minQty: feature.minQty || 1,
                        maxQty: feature.maxQty || 10,
                        customPrice: feature.customPrice || 0,
                        qty: feature.qty || feature.minQty || 1,
                        type: feature.type,
                      }))
                    : [],
                }}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute z-[99] left-[-20px] sm:left-[-10px] top-1/3 transform translate-x-1/2 bg-[#000080] text-white h-10 w-10 rounded-full hover:bg-[#000060]" />
        <CarouselNext className="absolute right-[20px] top-1/3 z-[99] transform translate-x-1/2 bg-[#000080] text-white h-10 w-10 rounded-full hover:bg-[#000060]" />
      </Carousel>
    </div>
  );
};

export default SubscriptionPlan;