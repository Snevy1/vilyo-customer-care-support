import {
  ArrowUp,
  Info,
  KeyRound,
  RotateCcwSquare,
  Ticket,
  UserPlus,
  Verified,
  Hash,
} from "lucide-react";
import React, { useState } from "react";
import Subscriptions from "./Subscriptions/page";
import PremiumFeatures from "./PremiumFeatures/page";
import Payments from "./Payments/page";
import Durations from "./Durations/page";
//import AIGeneratedRisks from "./AIGeneratedRisks";

// shadcn/ui imports

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const enum tabs {
  SUBSCRIPTIONS = "Subscriptions",
  PREMIUM_FEATURES = "Premium Features",
  PAYMENTS = "Payments",
  DURATIONS = "Durations",
  AI_GENERATED_RISK = "AI Generated Risk",
}

export default function Index() {
  const [activeTab, setActiveTab] = useState<string>("1");

  return (
    <div className="bg-white rounded-lg p-3">
      <Tabs defaultValue="1" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start h-auto bg-transparent border-b rounded-none p-0">
          <TabsTrigger
            value="1"
            className="flex items-center data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
          >
            <Verified className="mr-2" />
            <p className="text-lg font-medium text-[#838384]">Subscriptions</p>
          </TabsTrigger>

          <TabsTrigger
            value="2"
            className="flex items-center data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
          >
            <Ticket className="mr-2" />
            <p className="text-lg font-medium text-[#838384]">Premium Features</p>
          </TabsTrigger>

          <TabsTrigger
            value="3"
            className="flex items-center data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
          >
            <Ticket className="mr-2" />
            <p className="text-lg font-medium text-[#838384]">
              AI Generated Risks
            </p>
          </TabsTrigger>

          <TabsTrigger
            value="4"
            className="flex items-center data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
          >
            <RotateCcwSquare className="mr-2" />
            <p className="text-lg font-medium text-[#838384]">Payments</p>
          </TabsTrigger>

          <TabsTrigger
            value="5"
            className="flex items-center data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
          >
            <Hash className="mr-2" />
            <p className="text-lg font-medium text-[#838384]">Durations</p>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="1">
          <Subscriptions />
        </TabsContent>

        <TabsContent value="2">
          <PremiumFeatures />
        </TabsContent>

        {/* <TabsContent value="3">
          <AIGeneratedRisks />
        </TabsContent> */}

        <TabsContent value="4">
          <Payments />
        </TabsContent>

        <TabsContent value="5">
          <Durations />
        </TabsContent>
      </Tabs>
    </div>
  );
}