"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

interface DeleteSubscriptionProps {
  subscriptionPackageId: string;
  onDelete?: () => void;
}

export default function DeleteSubscription({ 
  subscriptionPackageId,
  onDelete 
}: DeleteSubscriptionProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const showModal = () => {
    setOpen(true);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Uncomment for API integration
      /*
      const response = await fetch(`/api/subscriptions/${subscriptionPackageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete subscription package');
      }

      // Refetch subscription packages
      // await refetch();
      */
      
      // Static implementation
      console.log("Deleting subscription package:", subscriptionPackageId);
      
      toast.success("Subscription package deleted successfully! (static mode)");
      setOpen(false);
      onDelete?.();
    } catch (error: any) {
      console.error("Failed to delete subscription package:", error);
      
      // Determine which service failed based on the error message
      let errorMessage = "Failed to delete subscription package.";
      if (error?.message?.includes("Stripe")) {
        errorMessage = "Failed to delete from Stripe. Please try again.";
      } else if (error?.message?.includes("PayPal")) {
        errorMessage = "Failed to delete from PayPal. Please try again.";
      } else {
        errorMessage = error?.message || "An unexpected error occurred";
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={showModal}
        variant="destructive"
        className="bg-[#FF4949] hover:bg-[#FF3333] text-white font-semibold"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>

      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#FF4949]" />
              Delete Subscription Package
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to delete this subscription package? Once deleted,
              it will no longer be available in the system or for users.
            </p>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-[#FF4949] hover:bg-[#FF3333]"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}