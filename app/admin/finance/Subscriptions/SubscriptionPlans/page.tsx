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
  // =============== WEBCHAT PLANS ===============
  {
    _id: "webchat_free_1",
    name: "Web Chat Free",
    subtitle: "Basic chat for small websites",
    basePriceMin: 0,
    basePriceMax: 0,
    minItems: 1,
    benefits: [
      "Up to 100 chats per month",
      "Basic chat widget customization",
      "Email support with 48-hour response time",
      "7-day chat history retention"
    ],
    features: [
      {
        _id: { name: "Basic Web Chat", price: 0, type: "item" },
        minQty: 1,
        maxQty: 1,
        customPrice: 0,
        qty: 1,
        type: "item"
      },
      {
        _id: { name: "AI Chatbot Responses", price: 5, type: "extra" },
        minQty: 0,
        maxQty: 1,
        customPrice: 5,
        qty: 0,
        type: "extra"
      }
    ]
  },
  {
    _id: "webchat_pro_1",
    name: "Web Chat Pro",
    subtitle: "Advanced chat for growing businesses",
    basePriceMin: 79,
    basePriceMax: 79,
    minItems: 1,
    benefits: [
      "Up to 5,000 chats per month",
      "Fully customizable chat widget",
      "24/7 priority support",
      "Unlimited chat history",
      "Advanced AI automation features",
      "Team collaboration tools"
    ],
    features: [
      {
        _id: { name: "Professional Web Chat", price: 79, type: "item" },
        minQty: 1,
        maxQty: 1,
        customPrice: 79,
        qty: 1,
        type: "item"
      },
      {
        _id: { name: "Advanced AI Automation", price: 20, type: "extra" },
        minQty: 0,
        maxQty: 1,
        customPrice: 20,
        qty: 0,
        type: "extra"
      },
      {
        _id: { name: "Additional Agent Seat", price: 15, type: "extra" },
        minQty: 0,
        maxQty: 9,
        customPrice: 15,
        qty: 0,
        type: "extra"
      }
    ]
  },

  // =============== WHATSAPP PLANS ===============
  {
    _id: "whatsapp_free_1",
    name: "WhatsApp Basic",
    subtitle: "14-day trial with basic messaging",
    basePriceMin: 0,
    basePriceMax: 0,
    minItems: 1,
    benefits: [
      "Up to 100 messages per month",
      "Basic AI response automation",
      "Single WhatsApp number integration",
      "Email support during trial period"
    ],
    features: [
      {
        _id: { name: "WhatsApp Basic Messaging", price: 0, type: "item" },
        minQty: 1,
        maxQty: 1,
        customPrice: 0,
        qty: 1,
        type: "item"
      },
      {
        _id: { name: "AI Response Engine", price: 10, type: "extra" },
        minQty: 0,
        maxQty: 1,
        customPrice: 10,
        qty: 0,
        type: "extra"
      }
    ]
  },
  {
    _id: "whatsapp_pro_1",
    name: "WhatsApp Pro",
    subtitle: "Advanced WhatsApp automation",
    basePriceMin: 99,
    basePriceMax: 99,
    minItems: 1,
    benefits: [
      "Up to 5,000 messages per month",
      "Custom AI training for responses",
      "Multiple WhatsApp numbers (up to 3)",
      "24/7 priority support",
      "Advanced analytics dashboard",
      "Custom integration capabilities"
    ],
    features: [
      {
        _id: { name: "WhatsApp Pro Messaging", price: 99, type: "item" },
        minQty: 1,
        maxQty: 1,
        customPrice: 99,
        qty: 1,
        type: "item"
      },
      {
        _id: { name: "Custom AI Training", price: 50, type: "extra" },
        minQty: 0,
        maxQty: 1,
        customPrice: 50,
        qty: 0,
        type: "extra"
      },
      {
        _id: { name: "Additional WhatsApp Number", price: 30, type: "extra" },
        minQty: 0,
        maxQty: 2,
        customPrice: 30,
        qty: 0,
        type: "extra"
      }
    ]
  },

  // =============== CRM PLANS ===============
  {
    _id: "crm_free_1",
    name: "CRM Free",
    subtitle: "Basic customer management",
    basePriceMin: 0,
    basePriceMax: 0,
    minItems: 1,
    benefits: [
      "Manage up to 100 contacts",
      "Basic contact information storage",
      "Email integration for basic communication",
      "Simple reporting and analytics"
    ],
    features: [
      {
        _id: { name: "Basic CRM", price: 0, type: "item" },
        minQty: 1,
        maxQty: 1,
        customPrice: 0,
        qty: 1,
        type: "item"
      },
      {
        _id: { name: "Email Campaigns", price: 5, type: "extra" },
        minQty: 0,
        maxQty: 1,
        customPrice: 5,
        qty: 0,
        type: "extra"
      }
    ]
  },
  {
    _id: "crm_pro_1",
    name: "CRM Pro",
    subtitle: "Advanced customer relationship management",
    basePriceMin: 99,
    basePriceMax: 99,
    minItems: 1,
    benefits: [
      "Unlimited contact management",
      "Advanced contact segmentation",
      "Email and phone integration",
      "Workflow automation tools",
      "Advanced analytics and reporting",
      "API access for custom integrations",
      "Customizable sales pipelines"
    ],
    features: [
      {
        _id: { name: "Professional CRM", price: 99, type: "item" },
        minQty: 1,
        maxQty: 1,
        customPrice: 99,
        qty: 1,
        type: "item"
      },
      {
        _id: { name: "Workflow Automation", price: 30, type: "extra" },
        minQty: 0,
        maxQty: 1,
        customPrice: 30,
        qty: 0,
        type: "extra"
      },
      {
        _id: { name: "Advanced Analytics Dashboard", price: 25, type: "extra" },
        minQty: 0,
        maxQty: 1,
        customPrice: 25,
        qty: 0,
        type: "extra"
      },
      {
        _id: { name: "Additional Team Member", price: 20, type: "extra" },
        minQty: 0,
        maxQty: 9,
        customPrice: 20,
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
      <div className="pl-0">
        <div className="flex gap-4 p-4 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-75">
              <Skeleton className="h-125 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="pl-0 p-4">
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
    <div className="pl-0">
      <Carousel className="relative overflow-x-scroll scrollbar-hide max-w-[100vw] md:max-w-[75vw]">
        <CarouselContent className="flex gap-2 md:gap-4 p-2 md:p-4">
          {subscriptionPackages?.map((pkg) => (
            <CarouselItem
              key={pkg._id}
              className="min-w-62.5  sm:min-w-75 md:min-w-87.5 lg:min-w-100 basis-[90%] sm:basis-[70%] md:basis-[50%] lg:basis-[40%] xl:basis-[30%]"
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
        <CarouselPrevious className="absolute z-99 -left-5 sm:-left-2.5 top-1/3 transform translate-x-1/2 bg-blue-400 text-white h-10 w-10 rounded-full hover:bg-blue-200" />
        <CarouselNext className="absolute right-5 top-1/3 z-99 transform translate-x-1/2 bg-blue-400 text-white h-10 w-10 rounded-full hover:bg-blue-200" />
      </Carousel>
    </div>
  );
};

export default SubscriptionPlan;