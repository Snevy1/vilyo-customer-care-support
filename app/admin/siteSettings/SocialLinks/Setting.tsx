"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Settings,
  Copy,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { toast } from "react-toastify";
import AddEditSocialLink from "./AddEditSocialLink";
import { SocialLink } from "@/@types/types"; 

interface SocialLinkSettingsProps {
  data: SocialLink;
  onUpdate: (updatedLink: SocialLink) => void;
  onDelete: (id: string) => void;
  onDuplicate: (link: SocialLink) => void;
}

export default function SocialLinkSettings({
  data,
  onUpdate,
  onDelete,
  onDuplicate
}: SocialLinkSettingsProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDuplicate = () => {
    const duplicatedLink: SocialLink = {
      ...data,
      id: `social_${Date.now()}`,
      name: `${data.name} (Copy)`
    };
    onDuplicate(duplicatedLink);
    setPopoverOpen(false);
    toast.success('Link duplicated successfully');
  };

  const handleDelete = () => {
    onDelete(data.id);
    setDeleteDialogOpen(false);
    setPopoverOpen(false);
    toast.success('Link removed successfully');
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-100"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-56 p-2" align="end">
          <div className="space-y-1">
            {/* Edit Option */}
            <AddEditSocialLink
              data={data}
              onSave={onUpdate}
              mode="edit"
            >
              <Button
                variant="ghost"
                className="w-full justify-start text-sm px-2 h-8"
              >
                <Copy className="h-3.5 w-3.5 mr-2" />
                Edit Link
              </Button>
            </AddEditSocialLink>
            
            {/* Duplicate Option */}
            <Button
              variant="ghost"
              className="w-full justify-start text-sm px-2 h-8"
              onClick={handleDuplicate}
            >
              <Copy className="h-3.5 w-3.5 mr-2" />
              Duplicate
            </Button>
            
            <Separator />
            
            {/* Delete Option */}
            <Button
              variant="ghost"
              className="w-full justify-start text-sm px-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Remove
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Remove Social Link
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this social link? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {data.icon ? (
                <img 
                  src={data.icon} 
                  alt={data.name}
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">{data.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <p className="font-medium">{data.name}</p>
                <p className="text-sm text-gray-500 truncate max-w-[200px]">
                  {data.link}
                </p>
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}