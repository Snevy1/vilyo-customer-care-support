"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CreditCard, 
  Link, 
  Wrench,
  Settings as SettingsIcon
} from "lucide-react";
import PaymentProcessors from "./PaymentProcessors/page";
import SocialLinks from "./SocialLinks/page";
import MaintenanceMode from "./MaintenanceMode/page";

enum SettingsTab {
  PAYMENT_PROCESSORS = "payment",
  SOCIAL_LINKS = "social",
  MAINTENANCE_MODE = "maintenance",
}

export default function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<SettingsTab>(SettingsTab.PAYMENT_PROCESSORS);

  const tabConfig = [
    {
      id: SettingsTab.PAYMENT_PROCESSORS,
      label: "Payment Processors",
      icon: <CreditCard className="h-4 w-4" />,
      description: "Configure payment gateways and processors",
      component: <PaymentProcessors />
    },
    {
      id: SettingsTab.SOCIAL_LINKS,
      label: "Social Links",
      icon: <Link className="h-4 w-4" />,
      description: "Manage social media profiles and links",
      component: <SocialLinks />
    },
    {
      id: SettingsTab.MAINTENANCE_MODE,
      label: "Maintenance Mode",
      icon: <Wrench className="h-4 w-4" />,
      description: "Control website availability and maintenance",
      component: <MaintenanceMode />
    }
  ];

  return (
    <div className="p-4 md:p-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-400 rounded-lg">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Site Settings</CardTitle>
              <CardDescription>
                Configure your website settings and preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs 
            defaultValue={SettingsTab.PAYMENT_PROCESSORS} 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as SettingsTab)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-1 sm:grid-cols-3 mb-8">
              {tabConfig.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 h-4 py-3 data-[state=active]:bg-blue-400 data-[state=active]:text-white"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {tabConfig.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {tab.icon}
                    <h3 className="text-xl font-semibold">{tab.label}</h3>
                  </div>
                  <p className="text-zinc-600">{tab.description}</p>
                </div>
                {tab.component}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}