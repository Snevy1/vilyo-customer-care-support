"use client"

import React, { useState, useEffect } from "react";
import { PoundSterling } from "lucide-react";

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {toast} from "sonner"

// TODO: Uncomment when API is ready
// import { useUpdateDurationMutation } from "@/store/duration/durations-api";
// import { useAddAdminNotificationMutation } from "@/store/dashboard/admin-notification-api";

interface EditDurationProps {
  data: {
    _id: string;
    name: number | string;
    price: number;
    visibility: boolean;
  };
  onClose: () => void;
}

const EditDuration = ({ data, onClose }: EditDurationProps) => {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [visibility, setVisibility] = useState(false);
  const [isLoading, setIsLoading] = useState(false);



  // TODO: Uncomment when API is ready
  // const [updateDuration] = useUpdateDurationMutation();
  // const [addNotification] = useAddAdminNotificationMutation();

  const getAuthState = (): any | null => {
    const authStateString = localStorage.getItem("authState");
    return authStateString ? JSON.parse(authStateString) : null;
  };

  const authState = getAuthState();
  const user = authState?.user;

  // Set form values when the component mounts
  useEffect(() => {
    if (data) {
      setName(data.name?.toString() || "");
      setDuration(data.name?.toString() || "");
      setPrice(data.price?.toString() || "");
      setVisibility(data.visibility || false);
    }
  }, [data]);

  const handleOk = async () => {
    try {
      setIsLoading(true);

      const values = {
        name: parseFloat(name),
        duration: parseFloat(duration),
        price: parseFloat(price),
        visibility,
      };

      const updatedData = {
        ...data,
        ...values,
      };

      // TODO: Uncomment when API is ready
      // await updateDuration({ id: data._id, updates: updatedData }).unwrap();
      // await addNotification({
      //   title: "Duration Updated",
      //   description: "Duration Updated",
      //   status: "unread",
      //   userId: user?._id,
      // }).unwrap();

      // Static implementation
      console.log("Updating duration:", updatedData);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Success",{
                    description: "Duration updated successfully! (static mode)",
                  })
      

      setOpen(false);
      onClose();
    } catch (error) {
      console.error("Failed to update duration:", error);
      toast.success("Error",{
                    description: "Failed to update duration",
                  })
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Duration</DialogTitle>
        </DialogHeader>

        <Separator className="my-2" />

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Duration Name (in hours)</Label>
            <Input
              id="name"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Total Hours</Label>
            <Input
              id="duration"
              placeholder="Enter Total Hours"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <div className="relative">
              <PoundSterling
                size={14}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <Input
                id="price"
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isLoading}
                className="pl-8"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Switch
              id="visibility"
              checked={visibility}
              onCheckedChange={setVisibility}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleOk}
            disabled={isLoading}
            className="bg-[#3838F0] hover:bg-[#2a2ac7]"
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditDuration;