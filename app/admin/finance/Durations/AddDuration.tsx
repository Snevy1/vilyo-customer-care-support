import React, { useState } from "react";

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
import {toast} from "sonner"

// TODO: Uncomment when API is ready
// import { useCreateDurationMutation } from "@/store/duration/durations-api";
// import { useAddAdminNotificationMutation } from "@/store/dashboard/admin-notification-api";

interface AddDurationProps {
  visible: boolean;
  onClose: () => void;
}

const AddDuration = ({ visible, onClose }: AddDurationProps) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [visibility, setVisibility] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  

  // TODO: Uncomment when API is ready
  // const [createDuration] = useCreateDurationMutation();
  // const [addNotification] = useAddAdminNotificationMutation();

  const getAuthState = (): any | null => {
    const authStateString = localStorage.getItem("authState");
    return authStateString ? JSON.parse(authStateString) : null;
  };

  const authState = getAuthState();
  const user = authState?.user;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Please input the duration name!";
    }
    if (!price.trim()) {
      newErrors.price = "Please input the price!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const values = {
        name: parseFloat(name),
        price: parseFloat(price),
        visibility,
      };

      // TODO: Uncomment when API is ready
      // await createDuration(values).unwrap();
      // await addNotification({
      //   title: "New duration added",
      //   description: "New duration added",
      //   status: "unread",
      //   userId: user?._id,
      // }).unwrap();

      // Static implementation
      console.log("Creating duration:", values);
      await new Promise((resolve) => setTimeout(resolve, 1000));
         toast.success("Success",{
        description: "Duration added successfully! (static mode)",
      })
      

      // Reset form
      setName("");
      setPrice("");
      setVisibility(false);
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Failed to add duration:", error);
      toast.error("Error",{
         description: "Failed to add duration",
      })

      
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setPrice("");
    setVisibility(false);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Duration</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Duration Name (in hours) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="number"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              disabled={isLoading}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">
              Price <span className="text-red-500">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (errors.price) setErrors({ ...errors, price: "" });
              }}
              disabled={isLoading}
              className={errors.price ? "border-red-500" : ""}
            />
            {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
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

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isLoading}
            className="bg-[#3838F0] hover:bg-[#2a2ac7]"
          >
            {isLoading ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddDuration;