"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  CloudUpload, 
  Image as ImageIcon,
  Link,
  Globe,
  X,
  Check
} from "lucide-react";
import { SocialLink, SocialLinkFormData } from "@/@types/types"; 
import { toast } from "react-toastify";

interface AddEditSocialLinkProps {
  data?: SocialLink;
  onSave: (link: SocialLink) => void;
  onCancel?: () => void;
  mode?: "add" | "edit";
  children?: React.ReactNode;
}

export default function AddEditSocialLink({
  data,
  onSave,
  onCancel,
  mode = "add",
  children
}: AddEditSocialLinkProps) {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(data?.icon || "");
  const [formValues, setFormValues] = useState<SocialLinkFormData>({
    name: data?.name || "",
    link: data?.link || "",
  });
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showModal = () => {
    setOpen(true);
    // Reset form to current data when opening
    setFormValues({
      name: data?.name || "",
      link: data?.link || "",
    });
    setSelectedImage(data?.icon || "");
  };

  const handleClose = () => {
    setOpen(false);
    if (onCancel) onCancel();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      setUploading(false);
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      setUploading(false);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setSelectedImage(result);
      setUploading(false);
      toast.success('Image selected successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    // Validation
    if (!formValues.name.trim()) {
      toast.error('Please enter a name for the social link');
      return;
    }

    if (!formValues.link.trim()) {
      toast.error('Please enter a link URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(formValues.link);
    } catch {
      toast.error('Please enter a valid URL (include https://)');
      return;
    }

    if (!selectedImage) {
      toast.error('Please select an icon for the social link');
      return;
    }

    const updatedLink: SocialLink = {
      id: data?.id || `social_${Date.now()}`,
      name: formValues.name.trim(),
      link: formValues.link.trim(),
      icon: selectedImage,
    };

    onSave(updatedLink);
    setOpen(false);
    
    // Reset form
    setFormValues({ name: "", link: "" });
    setSelectedImage("");
  };

  const handleRemoveImage = () => {
    setSelectedImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Detect platform from link
  const detectPlatform = (url: string): string => {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('facebook.com')) return 'Facebook';
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'Twitter';
    if (urlLower.includes('instagram.com')) return 'Instagram';
    if (urlLower.includes('linkedin.com')) return 'LinkedIn';
    if (urlLower.includes('youtube.com')) return 'YouTube';
    if (urlLower.includes('tiktok.com')) return 'TikTok';
    if (urlLower.includes('pinterest.com')) return 'Pinterest';
    if (urlLower.includes('github.com')) return 'GitHub';
    return 'Custom';
  };

  // Auto-detect platform when link changes
  const handleLinkChange = (link: string) => {
    setFormValues((prev:any) => ({ ...prev, link }));
    
    // Auto-fill name if empty
    if (!formValues.name.trim()) {
      const platform = detectPlatform(link);
      if (platform !== 'Custom') {
        setFormValues((prev:any) => ({ ...prev, name: platform }));
      }
    }
  };

  return (
    <>
      {children ? (
        <div onClick={showModal} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <Button
          onClick={showModal}
          variant={mode === "edit" ? "outline" : "default"}
          size={mode === "edit" ? "sm" : "default"}
          className={mode === "add" ? "bg-[#3838F0] hover:bg-[#2a2ac7]" : ""}
        >
          {mode === "edit" ? (
            <>
              <ImageIcon className="h-4 w-4 mr-2" />
              Edit
            </>
          ) : (
            <>
              <Globe className="h-4 w-4 mr-2" />
              Add Social Link
            </>
          )}
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {mode === "edit" ? "Edit Social Link" : "Add New Social Link"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image Preview and Upload */}
            <div className="space-y-3">
              <Label>Platform Icon</Label>
              
              {selectedImage ? (
                <Card className="border-dashed border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedImage}
                          alt="Icon preview"
                          className="h-12 w-12 object-contain rounded"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/48x48/cccccc/666666?text=Icon';
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium">Selected Icon</p>
                          <p className="text-xs text-gray-500">Click to change</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#3838F0] hover:bg-gray-50 transition-colors"
                >
                  <CloudUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    Click to upload icon
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              
              {uploading && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-gray-300 border-t-[#3838F0] rounded-full animate-spin" />
                  Uploading image...
                </div>
              )}
            </div>

            <Separator />

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Platform Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formValues.name}
                  onChange={(e) => setFormValues((prev:any) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Facebook, Twitter, Instagram"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">
                  Link URL <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="link"
                    value={formValues.link}
                    onChange={(e) => handleLinkChange(e.target.value)}
                    placeholder="https://example.com"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Must include https:// or http://
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={uploading || !formValues.name || !formValues.link || !selectedImage}
              className="bg-[#3838F0] hover:bg-[#2a2ac7]"
            >
              <Check className="h-4 w-4 mr-2" />
              {mode === "edit" ? "Update Link" : "Add Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}