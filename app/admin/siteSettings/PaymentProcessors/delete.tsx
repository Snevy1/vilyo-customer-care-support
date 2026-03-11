"use client";

import React, { useState } from "react";

// Shadcn imports
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// import { useRemovePaymentProcessorMutation } from "@/store/payments/payment-processor-api";

interface DeleteProcessorProps {
  processorId: string;
  onSuccess: () => void;
}

export default function DeleteProcessor({ processorId,onSuccess }: DeleteProcessorProps) {
  const [open, setOpen] = useState(false);
  // const [deletePaymentProcessor, { isLoading: isDeleting }] = useRemovePaymentProcessorMutation();

  const handleDelete = async () => {
    // try {
    //   await deletePaymentProcessor(processorId).unwrap();
    //   console.log("Deleted successfully");
    //   setOpen(false);
    // } catch (error) {
    //   console.error("Delete failed");
    // }

    // Local simulation
    console.log(`Deleted processor ${processorId} (local only)`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span className="cursor-pointer text-[#EA1C1C] hover:underline">Remove</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Payment Processor</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this payment processor? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-4" />

        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            // disabled={isDeleting}
          >
            {/* {isDeleting ? "Deleting..." : */}Delete Processor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}