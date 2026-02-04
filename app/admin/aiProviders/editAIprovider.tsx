import { Gear } from "@phosphor-icons/react";
import { Button, Form, Input, Modal, Switch, message } from "antd";
import { Circle, CloudUploadIcon, Plus, X } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { AIModel } from "@/@types/types"; 

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
  const [form] = Form.useForm();
  const [step1Data, setStep1Data] = useState<any>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pros, setPros] = useState<string>("");
  const [prosAr, setProsAr] = useState<string[]>([]);
  const [cons, setCons] = useState<string>("");
  const [consAr, setConsAr] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showModal = () => {
    setOpen(true);
  };

  const handleNextStep = async () => {
    try {
      const values = await form.validateFields();
      setStep1Data(values);
      setStep(2);
    } catch (error) {
      console.error("Validation failed:", error);
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
      const completeData = { ...step1Data, ...step2Data };
      Object.keys(completeData).forEach((key) => {
        if (Array.isArray(completeData[key])) {
          formData.append(key, JSON.stringify(completeData[key]));
        } else if (typeof completeData[key] === 'boolean') {
          formData.append(key, completeData[key].toString());
        } else {
          formData.append(key, completeData[key]);
        }
      });

      // Add the file if there is one
      if (fileToUpload) {
        formData.append("image", fileToUpload);
      }

      await onUpdate(id, formData);
      
      message.success("AI provider updated successfully");
      setOpen(false);
      setStep(1);
      form.resetFields();
      setProsAr([]);
      setConsAr([]);
      setPreviewImage(null);
      setFileToUpload(null);
      setStep1Data(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to update AI provider:", error);
      message.error("Failed to update AI provider");
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setStep(1);
    form.resetFields();
    setPreviewImage(null);
    setFileToUpload(null);
    setStep1Data(null);
    setProsAr([]);
    setConsAr([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Populate the form with existing data when the modal is opened
  useEffect(() => {
    if (open && provider) {
      form.setFieldsValue({
        name: provider.name,
        apiKey: provider.apiKey,
        price: provider.price,
        visible: provider.visible,
      });
      setProsAr(provider.pros || []);
      setConsAr(provider.cons || []);
      setPreviewImage(provider.logoUrl || null);
    }
  }, [open, provider, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      message.error("Image must be smaller than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      message.error("Please upload an image file");
      return;
    }

    setFileToUpload(file);

    // Create a URL for preview
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
  };

  return (
    <>
      <Gear size={20} className="cursor-pointer" onClick={showModal} />

      <Modal
        title="Edit AI Provider"
        open={open}
        onCancel={handleCancel}
        footer={[
          <div className="mt-5" key="footer-buttons">
            <Button onClick={handleCancel} className="mr-5">
              Cancel
            </Button>
            {step === 1 ? (
              <Button
                className="text-white bg-[#3838F0] px-5"
                onClick={handleNextStep}
              >
                Next
              </Button>
            ) : (
              <Button
                className="text-white bg-[#3838F0] px-5"
                onClick={handleOk}
                loading={loading}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save AI Provider"}
              </Button>
            )}
          </div>,
        ]}
      >
        {step === 1 ? (
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="AI Provider Name"
              rules={[{ required: true, message: 'Please enter AI provider name' }]}
            >
              <Input className="py-2" placeholder="Name" disabled={loading} />
            </Form.Item>
            <Form.Item
              name="apiKey"
              label="API Key"
              rules={[{ required: true, message: 'Please enter API key' }]}
            >
              <Input.TextArea
                autoSize={{ minRows: 1, maxRows: 5 }}
                className="py-2"
                placeholder="API Key"
                disabled={loading}
              />
            </Form.Item>
            <Form.Item 
              name="price" 
              label="Price" 
              rules={[
                { required: true, message: 'Please enter price' },
                { pattern: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid price' }
              ]}
            >
              <Input 
                className="py-2" 
                placeholder="Price" 
                type="number" 
                step="0.01"
                min="0"
                disabled={loading}
              />
            </Form.Item>
            <div className="flex justify-between mt-5">
              <p>Enable / Disable Visibility</p>
              <Form.Item name="visible" valuePropName="checked" noStyle>
                <Switch disabled={loading} />
              </Form.Item>
            </div>
          </Form>
        ) : (
          <Form layout="vertical">
            <div className="flex flex-col">
              <p className="text-lg font-semiBold">AI Logo</p>
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
            <div className="flex flex-col my-7">
              <p className="text-lg font-semiBold">Pros</p>
              <div className="flex">
                <Input
                  className="py-2"
                  placeholder="Add Benefits"
                  onChange={(e:any) => setPros(e.target.value)}
                  value={pros}
                  onKeyDown={(e:any) => {
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
                <button
                  onClick={() => {
                    if (pros === "") return;
                    setProsAr([...prosAr, pros]);
                    setPros("");
                  }}
                  className="bg-[#3838F0] text-white px-4 py-2 rounded-md ml-3 disabled:opacity-50"
                  disabled={loading}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div>
                {prosAr.map((item, index) => (
                  <div
                    key={index}
                    className="ml-1 text-black/60 flex flex-row items-center space-x-2 text-sm mt-2"
                  >
                    <Circle
                      size={10}
                      className="bg-gray-400 rounded-full mr-2"
                    />
                    <span className="flex-1">{item}</span>
                    <X
                      onClick={() => {
                        if (loading) return;
                        const filtered = prosAr.filter(
                          (_, idx) => idx !== index
                        );
                        setProsAr(filtered);
                      }}
                      className="bg-indigo-600 rounded-full text-white cursor-pointer hover:bg-indigo-700"
                      size={12}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col my-7">
              <p className="text-lg font-semiBold">Cons</p>
              <div className="flex">
                <Input
                  className="py-2"
                  placeholder="Add Demerits"
                  onChange={(e:any) => setCons(e.target.value)}
                  value={cons}
                  onKeyDown={(e:any) => {
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
                <button
                  onClick={() => {
                    if (cons === "") return;
                    setConsAr([...consAr, cons]);
                    setCons("");
                  }}
                  className="bg-[#3838F0] text-white px-4 py-2 rounded-md ml-3 disabled:opacity-50"
                  disabled={loading}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div>
                {consAr.map((item, index) => (
                  <div
                    key={index}
                    className="ml-1 text-black/60 flex flex-row items-center space-x-2 text-sm mt-2"
                  >
                    <Circle
                      size={10}
                      className="bg-gray-400 rounded-full mr-2"
                    />
                    <span className="flex-1">{item}</span>
                    <X
                      onClick={() => {
                        if (loading) return;
                        const filtered = consAr.filter(
                          (_, idx) => idx !== index
                        );
                        setConsAr(filtered);
                      }}
                      className="bg-indigo-600 rounded-full text-white cursor-pointer hover:bg-indigo-700"
                      size={12}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Form>
        )}
      </Modal>
    </>
  );
}