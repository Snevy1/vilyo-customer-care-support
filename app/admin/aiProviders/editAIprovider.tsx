import { Settings } from "lucide-react";
import { Circle, CloudUploadIcon, Plus, X } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { AIModel } from "@/@types/types";

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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner"

interface EditAIProviderProps {
  id: string;
  provider?: AIModel;
  onUpdate: (id: string, formData: FormData) => Promise<void>;
  loading?: boolean;
}

export default function EditAIProvider({
  id,
  provider,
  onUpdate,
  loading = false,
}: EditAIProviderProps) {
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [price, setPrice] = useState("");
  const [visible, setVisible] = useState(true);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pros, setPros] = useState<string>("");
  const [prosAr, setProsAr] = useState<string[]>([]);
  const [cons, setCons] = useState<string>("");
  const [consAr, setConsAr] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);


  const showModal = () => {
    setOpen(true);
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Please enter AI provider name";
    }
    if (!apiKey.trim()) {
      newErrors.apiKey = "Please enter API key";
    }
    if (!price.trim()) {
      newErrors.price = "Please enter price";
    } else if (!/^\d+(\.\d{1,2})?$/.test(price)) {
      newErrors.price = "Please enter a valid price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleOk = async () => {
    try {
      const step2Data = {
        pros: prosAr,
        cons: consAr,
        isActive: true,
      };

      // Create FormData for multipart/form-data submission
      const formData = new FormData();

      // Add all the text data
      const completeData = {
        name,
        apiKey,
        price,
        visible,
        ...step2Data,
      };

      Object.keys(completeData).forEach((key) => {
        if (Array.isArray(completeData[key as keyof typeof completeData])) {
          formData.append(key, JSON.stringify(completeData[key as keyof typeof completeData]));
        } else if (typeof completeData[key as keyof typeof completeData] === "boolean") {
          formData.append(key, completeData[key as keyof typeof completeData].toString());
        } else {
          formData.append(key, completeData[key as keyof typeof completeData] as string);
        }
      });

      // Add the file if there is one
      if (fileToUpload) {
        formData.append("image", fileToUpload);
      }

      await onUpdate(id, formData);

      toast.success("Success", {
    description: "AI provider updated successfully",
  });

      

      setOpen(false);
      setStep(1);
      resetForm();
    } catch (error) {
      console.error("Failed to update AI provider:", error);
      toast.error("Error", {
    description: "Failed to update AI provider",
  });
      
    }
  };

  const resetForm = () => {
    setName("");
    setApiKey("");
    setPrice("");
    setVisible(true);
    setProsAr([]);
    setConsAr([]);
    setPreviewImage(null);
    setFileToUpload(null);
    setErrors({});

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setStep(1);
    resetForm();
  };

  // Populate the form with existing data when the modal is opened
  useEffect(() => {
    if (open && provider) {
      setName(provider.name);
      setApiKey(provider.apiKey);
      setPrice(provider.price.toString());
      setVisible(provider.visible);
      setProsAr(provider.pros || []);
      setConsAr(provider.cons || []);
      setPreviewImage(provider.logoUrl || null);
    }
  }, [open, provider]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Error", {
    description: "Image must be smaller than 5MB",
  });
      
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Error", {
    description: "Please upload an image file",
  });
      
      return;
    }

    setFileToUpload(file);

    // Create a URL for preview
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
  };

  return (
    <>
      <Settings size={20} className="cursor-pointer" onClick={showModal} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto text-zinc-700">
          <DialogHeader>
            <DialogTitle>Edit AI Provider</DialogTitle>
          </DialogHeader>

          {step === 1 ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  AI Provider Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors({ ...errors, name: "" });
                    }
                  }}
                  disabled={loading}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">
                  API Key <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="apiKey"
                  placeholder="API Key"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (errors.apiKey) {
                      setErrors({ ...errors, apiKey: "" });
                    }
                  }}
                  disabled={loading}
                  rows={3}
                  className={errors.apiKey ? "border-red-500" : ""}
                />
                {errors.apiKey && (
                  <p className="text-sm text-red-500">{errors.apiKey}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">
                  Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (errors.price) {
                      setErrors({ ...errors, price: "" });
                    }
                  }}
                  disabled={loading}
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="visible">Enable / Disable Visibility</Label>
                <Switch
                  id="visible"
                  checked={visible}
                  onCheckedChange={setVisible}
                  disabled={loading}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="flex flex-col">
                <Label className="text-lg font-semibold mb-2">AI Logo</Label>
                <div className="flex flex-col items-center py-5">
                  <input
                    type="file"
                    accept="image/*"
                    id="imageUpload"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  {previewImage ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover mb-3"
                      />
                      <label
                        htmlFor="imageUpload"
                        className="cursor-pointer text-[#3838F0] flex items-center hover:underline"
                      >
                        <CloudUploadIcon className="h-6 w-6 mr-2" />
                        <span>Change</span>
                      </label>
                    </div>
                  ) : (
                    <label
                      htmlFor="imageUpload"
                      className="flex items-center cursor-pointer text-[#3838F0] hover:underline"
                    >
                      <CloudUploadIcon className="h-6 w-6 mr-2" />
                      <span>Click to Add image</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <Label className="text-lg font-semibold mb-2">Pros</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add Benefits"
                    value={pros}
                    onChange={(e) => setPros(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (pros.trim() !== "") {
                          setProsAr([...prosAr, pros]);
                          setPros("");
                        }
                      }
                    }}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (pros === "") return;
                      setProsAr([...prosAr, pros]);
                      setPros("");
                    }}
                    className="bg-[#3838F0] hover:bg-[#2a2ac7]"
                    disabled={loading}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                <div className="mt-2 space-y-2">
                  {prosAr.map((item, index) => (
                    <div
                      key={index}
                      className="ml-1 text-black/60 flex flex-row items-center space-x-2 text-sm"
                    >
                      <Circle
                        size={10}
                        className="bg-gray-400 rounded-full mr-2"
                      />
                      <span className="flex-1">{item}</span>
                      <X
                        onClick={() => {
                          if (loading) return;
                          const filtered = prosAr.filter((_, idx) => idx !== index);
                          setProsAr(filtered);
                        }}
                        className="bg-indigo-600 rounded-full text-white cursor-pointer hover:bg-indigo-700"
                        size={12}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col">
                <Label className="text-lg font-semibold mb-2">Cons</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add Demerits"
                    value={cons}
                    onChange={(e) => setCons(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (cons.trim() !== "") {
                          setConsAr([...consAr, cons]);
                          setCons("");
                        }
                      }
                    }}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (cons === "") return;
                      setConsAr([...consAr, cons]);
                      setCons("");
                    }}
                    className="bg-[#3838F0] hover:bg-[#2a2ac7]"
                    disabled={loading}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                <div className="mt-2 space-y-2">
                  {consAr.map((item, index) => (
                    <div
                      key={index}
                      className="ml-1 text-black/60 flex flex-row items-center space-x-2 text-sm"
                    >
                      <Circle
                        size={10}
                        className="bg-gray-400 rounded-full mr-2"
                      />
                      <span className="flex-1">{item}</span>
                      <X
                        onClick={() => {
                          if (loading) return;
                          const filtered = consAr.filter((_, idx) => idx !== index);
                          setConsAr(filtered);
                        }}
                        className="bg-indigo-600 rounded-full text-white cursor-pointer hover:bg-indigo-700"
                        size={12}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            {step === 1 ? (
              <Button
                onClick={handleNextStep}
                className="bg-[#3838F0] hover:bg-[#2a2ac7] text-white"
                disabled={loading}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleOk}
                className="bg-[#3838F0] hover:bg-[#2a2ac7] text-white"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save AI Provider"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}