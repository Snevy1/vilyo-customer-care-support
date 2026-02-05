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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CloudUpload,
  Image as ImageIcon,
  RefreshCw,
  X,
  Check
} from "lucide-react";
import { toast } from "react-toastify";

interface LogoUploadProps {
  currentImage: string;
  label: string;
  description?: string;
  onUpdate: (newImageUrl: string) => void;
}

export default function LogoUpload({
  currentImage,
  label,
  description,
  onUpdate
}: LogoUploadProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showModal = () => {
    setOpen(true);
    // Reset to current image when opening
    setPreviewUrl(currentImage);
    setSelectedFile(null);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFile(null);
    setPreviewUrl(currentImage);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, SVG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    
    toast.success('Image selected for upload');
  };

  const handleRemoveSelected = () => {
    setSelectedFile(null);
    setPreviewUrl(currentImage);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image to upload');
      return;
    }

    setUploading(true);

    try {
      // TODO: Uncomment for API integration
      /*
      const formData = new FormData();
      formData.append('logo', selectedFile);
      formData.append('label', label);
      formData.append('type', 'siteLogo');

      const response = await fetch('/api/settings/upload-logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      const newImageUrl = data.imageUrl;
      */

      // Static implementation
      setTimeout(() => {
        // Simulate upload and get new URL
        const newImageUrl = `https://via.placeholder.com/150x50/3838F0/ffffff?text=${encodeURIComponent(label)}`;
        
        onUpdate(newImageUrl);
        toast.success(`${label} updated successfully! (static mode)`);
        setOpen(false);
        setUploading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo. Please try again.');
      setUploading(false);
    }
  };

  const getLogoRecommendations = () => {
    if (label.toLowerCase().includes('favicon')) {
      return 'Recommended: 16x16 or 32x32 PNG';
    } else if (label.toLowerCase().includes('admin')) {
      return 'Recommended: 150x50 PNG with transparent background';
    } else {
      return 'Recommended: 150x50 PNG, max 5MB';
    }
  };

  return (
    <>
      <Button
        onClick={showModal}
        variant="outline"
        className="border-[#3838F0] text-[#3838F0] hover:bg-[#3838F0] hover:text-white"
      >
        <CloudUpload className="h-4 w-4 mr-2" />
        Upload New
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Update {label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current and Preview */}
            <div className="space-y-3">
              <Label>Logo Preview</Label>
              
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt={`${label} preview`}
                        className="h-20 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/150x50/cccccc/666666?text=Logo';
                        }}
                      />
                      
                      {selectedFile && (
                        <div className="absolute -top-2 -right-2">
                          <Badge variant="secondary" className="bg-green-500 text-white">
                            New
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className="font-medium">{label}</p>
                      {description && (
                        <p className="text-sm text-gray-500">{description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {getLogoRecommendations()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* File Upload */}
            <div className="space-y-3">
              <Label htmlFor="logo-upload">
                Select New Image <span className="text-red-500">*</span>
              </Label>
              
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveSelected}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#3838F0] hover:bg-gray-50 transition-colors"
                >
                  <CloudUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    Click to upload new logo
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, SVG up to 5MB
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
              
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(currentImage);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  disabled={!selectedFile || uploading}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <CloudUpload className="h-3 w-3 mr-1" />
                  {selectedFile ? 'Change File' : 'Browse...'}
                </Button>
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
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-[#3838F0] hover:bg-[#2a2ac7]"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Upload & Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Badge component for showing "New" indicator
function Badge({ 
  variant = "default", 
  className = "", 
  children 
}: { 
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  children: React.ReactNode;
}) {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors";
  
  const variantStyles = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground border"
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}