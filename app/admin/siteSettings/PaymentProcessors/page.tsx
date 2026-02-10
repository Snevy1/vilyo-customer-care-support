"use client";

import { ArrowUp, ArrowDown, Crown, Settings } from "lucide-react";
import React, { useState, useEffect } from "react";
// import { message } from "antd";  // ← removed

// Shadcn/ui imports (make sure these are added via npx shadcn@latest add ...)
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

// Assuming these components exist in your project (you'll need to keep / adapt them)
import AddNew from "./AddNew";
import ViewEdit from "./ViewEdit";
import DeleteProcessor from "./delete";

// If you want to show toast notifications later, import from sonner:
// import { toast } from "@/components/ui/use-toast";

interface PaymentProcessor {
  _id: string;
  name: string;
  apiKey: string;
  secretKey: string;
  authKey: string;
  logoUrl: string;
  isEnabled?: boolean;
  priority?: number;
  is_top_priority?: boolean;
}

export default function AdminUser() {
  const [openPopoverKey, setOpenPopoverKey] = useState<string | null>(null);
  const [settings, setSettings] = useState<PaymentProcessor[]>([]);

  // ────────────────────────────────────────────────
  // Hardcoded static data (replace API fetch)
  // You can uncomment the real query/mutations later
  // ────────────────────────────────────────────────
  useEffect(() => {
    const mockData: PaymentProcessor[] = [
      {
        _id: "1",
        name: "Stripe",
        apiKey: "pk_test_xxx",
        secretKey: "sk_test_xxx",
        authKey: "",
        logoUrl: "/stripe-logo.svg",
        isEnabled: true,
        priority: 0,
        is_top_priority: true,
      },
      {
        _id: "2",
        name: "PayPal",
        apiKey: "xxx",
        secretKey: "xxx",
        authKey: "xxx",
        logoUrl: "/paypal-logo.svg",
        isEnabled: true,
        priority: 1,
        is_top_priority: false,
      },
      {
        _id: "3",
        name: "M-Pesa",
        apiKey: "xxx",
        secretKey: "xxx",
        authKey: "xxx",
        logoUrl: "/M-Pesa-logo.png",
        isEnabled: false,
        priority: 2,
        is_top_priority: false,
      },
      /* {
        _id: "4",
        name: "Flutterwave",
        apiKey: "xxx",
        secretKey: "xxx",
        authKey: "xxx",
        logoUrl: "https://example.com/flutterwave-logo.png",
        isEnabled: true,
        priority: 3,
        is_top_priority: false,
      }, */
    ];

    setSettings(
      mockData
        .map((p) => ({ ...p, is_top_priority: p.is_top_priority || false }))
        .sort((a, b) => {
          if (a.is_top_priority && !b.is_top_priority) return -1;
          if (!a.is_top_priority && b.is_top_priority) return 1;
          return (a.priority ?? 999) - (b.priority ?? 999);
        })
    );
  }, []);

  // const { data, isLoading, refetch } = useGetAllPaymentProcessorsQuery();
  // const [updatePaymentProcessor] = useUpdatePaymentProcessorMutation();
  // const [addNotification] = useAddAdminNotificationMutation();

  // const getAuthState = () => { ... };
  // const authState = getAuthState();
  // const user = authState?.user;

  const handleReorder = (index: number, direction: "up" | "down") => {
    const newSettings = [...settings];

    if (direction === "up" && index > 0) {
      [newSettings[index - 1].priority, newSettings[index].priority] = [
        newSettings[index].priority,
        newSettings[index - 1].priority,
      ];
      if (newSettings[index - 1].is_top_priority) {
        newSettings[index].is_top_priority = true;
        newSettings[index - 1].is_top_priority = false;
      }
    } else if (direction === "down" && index < newSettings.length - 1) {
      [newSettings[index].priority, newSettings[index + 1].priority] = [
        newSettings[index + 1].priority,
        newSettings[index].priority,
      ];
      if (newSettings[index].is_top_priority) {
        newSettings[index].is_top_priority = false;
        newSettings[index + 1].is_top_priority = true;
      }
    }

    // Reassign consecutive priorities
    newSettings.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
    newSettings.forEach((p, idx) => {
      p.priority = idx;
    });

    // ────────────────────────────────────────────────
    // Commented out real backend update
    // try {
    //   await Promise.all(newSettings.map(async (p) => {
    //     await updatePaymentProcessor({ id: p._id, data: { priority: p.priority, is_top_priority: p.is_top_priority } }).unwrap();
    //   }));
    //   await addNotification({...}).unwrap();
    //   message.success("Reordered!");
    // } catch {
    //   message.error("Failed");
    // }
    // ────────────────────────────────────────────────

    // For now — just update local state + fake success
    console.log("Reordered (local only)");
    // toast({ title: "Reordered (local only)" }); // ← optional
    setSettings(newSettings);
    // refetch();
  };

  const handleToggleEnabled = (record: PaymentProcessor, checked: boolean) => {
    const newSettings = settings.map((p) =>
      p._id === record._id ? { ...p, isEnabled: checked } : p
    );

    // ────────────────────────────────────────────────
    // Commented out real update
    // try {
    //   await updatePaymentProcessor({ id: record._id, data: { isEnabled: checked } }).unwrap();
    //   await addNotification({...}).unwrap();
    //   message.success(`Processor ${checked ? "enabled" : "disabled"}`);
    // } catch {
    //   message.error("Failed");
    // }
    // ────────────────────────────────────────────────

    console.log(`Toggled ${record.name} → ${checked} (local only)`);
    setSettings(newSettings);
    // refetch();
  };

  const handleSetTopPriority = (record: PaymentProcessor) => {
    const newSettings = [...settings];

    newSettings.forEach((p) => {
      p.is_top_priority = p._id === record._id;
    });

    // Reassign priorities
    newSettings.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
    newSettings.forEach((p, idx) => {
      p.priority = idx;
    });

    // ────────────────────────────────────────────────
    // Commented out real update
    // try {
    //   await Promise.all(...);
    //   message.success("Top priority set");
    // } catch {
    //   message.error("Failed");
    // }
    // ────────────────────────────────────────────────

    console.log(`Set ${record.name} as top priority (local only)`);
    setSettings(newSettings);
    setOpenPopoverKey(null);
    // refetch();
  };

  return (
    <div className="flex flex-col bg-white rounded-lg mt-5 shadow-sm border">
      <div className="w-full flex items-center p-5">
        <p className="text-xl font-medium text-black">Payment Processors</p>
        <div className="flex ml-auto">
          <AddNew /* onRefetch={refetch} */ />
        </div>
      </div>

      <div className="px-3 pb-5">
        <Table className="mt-3 border rounded-md">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Priority</TableHead>
              <TableHead>Payment Processor</TableHead>
              <TableHead className="w-24 text-center">Move</TableHead>
              <TableHead className="w-24 text-center">Enabled</TableHead>
              <TableHead className="w-16 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {settings.map((record, index) => (
              <TableRow key={record._id}>
                <TableCell className="text-center font-medium">
                  {index + 1}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1 min-w-35">
                      <span className="font-medium">{record.name}</span>
                      <img
                        src={record.logoUrl}
                        alt={record.name}
                        className="h-8 w-auto object-contain"
                      />
                    </div>

                    {record.is_top_priority && (
                      <>
                        <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-400 border border-blue-300">
                          Top Priority
                        </span>
                        <Crown className="text-blue-500 md:hidden h-5 w-5" />
                      </>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleReorder(index, "up")}
                      disabled={index === 0}
                      className={`p-1 rounded hover:bg-gray-100 ${
                        index === 0 ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                    >
                      <ArrowUp className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => handleReorder(index, "down")}
                      disabled={index === settings.length - 1}
                      className={`p-1 rounded hover:bg-gray-100 ${
                        index === settings.length - 1
                          ? "opacity-40 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <ArrowDown className="h-5 w-5" />
                    </button>
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <Switch
                    checked={record.isEnabled}
                    onCheckedChange={(checked) =>
                      handleToggleEnabled(record, checked)
                    }
                  />
                </TableCell>

                <TableCell className="text-center">
                  <Popover
                    open={openPopoverKey === record._id}
                    onOpenChange={(open) =>
                      setOpenPopoverKey(open ? record._id : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-56 p-2" align="end">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          className="justify-start text-left px-3 py-2 text-sm"
                          onClick={() => handleSetTopPriority(record)}
                        >
                          Set As Top Priority
                        </Button>

                        <Separator className="my-1" />

                        <ViewEdit
                          data={ {
    ...record,
    provider: (record as any).provider || "stripe",           // fallback or from your data
    customerPortalLink: (record as any).customerPortalLink || "",
    webhookSecretKey: (record as any).webhookSecretKey || "",
    // add userTypes / orgTypes if needed
  }}
                          // onRefetch={refetch}
                        />

                        <Separator className="my-1" />

                        <DeleteProcessor processorId={record._id} />
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}