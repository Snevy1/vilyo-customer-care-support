import React, { useState } from "react";

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {toast} from "sonner"
import { AlertTriangle } from "lucide-react";

// TODO: Uncomment when API is ready
// import { useDeleteDurationMutation } from "@/store/duration/durations-api";

interface DeleteDurationProps {
  visible: boolean;
  onClose: () => void;
  durationId: string;
}

export default function DeleteDuration({
  visible,
  onClose,
  durationId,
}: DeleteDurationProps) {
  const [isLoading, setIsLoading] = useState(false);
 

  // TODO: Uncomment when API is ready
  // const [deleteDuration] = useDeleteDurationMutation();

  const handleDelete = async () => {
    try {
      setIsLoading(true);

      // TODO: Uncomment when API is ready
      // await deleteDuration(durationId).unwrap();

      // Static implementation
      console.log("Deleting duration:", durationId);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Success",{
              description: "Duration deleted successfully! (static mode)",
            })
      

      onClose();
    } catch (error) {
      console.error("Failed to delete duration:", error);
      toast.error("Error",{
              description: "Failed to delete duration",
            })
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Duration
          </DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to delete this duration? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}