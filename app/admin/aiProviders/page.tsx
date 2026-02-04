import CustomSearch from "@/components/shared/ReuseAble/input";
import { Warning } from "@phosphor-icons/react";
import {
  Button,
  message,
  Modal,
  notification,
  Switch,
  Table,
  TableColumnsType,
} from "antd";
import { PoundSterling } from "lucide-react";
import React, { useState, useEffect } from "react";
import AddAIProvider from "./addAIprovider"
import EditAIProvider from "./editAIprovider";
import { AIModel } from "@/@types/types"; 
import { useStore } from "@/store/store";

// Static data for migration
const staticAIProviders: AIModel[] = [
  {
    _id: "1",
    name: "OpenAI GPT-4",
    apiKey: "sk-...1234",
    price: 0.02,
    visible: true,
    pros: ["Fast response", "Accurate", "Multi-language support"],
    cons: ["Costly for high usage"],
    isActive: true,
    logoUrl: "/images/openai-logo.png",
  },
  {
    _id: "2",
    name: "Anthropic Claude",
    apiKey: "claude-...5678",
    price: 0.015,
    visible: true,
    pros: ["Long context", "Helpful", "Safety focused"],
    cons: ["Slower response time"],
    isActive: true,
    logoUrl: "/images/claude-logo.png",
  },
  {
    _id: "3",
    name: "Google Gemini",
    apiKey: "gemini-...9012",
    price: 0.01,
    visible: false,
    pros: ["Free tier", "Google integration", "Good for research"],
    cons: ["Limited capabilities"],
    isActive: true,
    logoUrl: "/images/gemini-logo.png",
  },
];

export default function AIProvidersIndex() {
  const [type, setType] = useState("public");
  const [open, setOpen] = useState(false);
  const [selectedAIProviderId, setSelectedAIProviderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [aiProviders, setAiProviders] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get user from store (for notification purposes)
  const user = useStore((state:any) => state.auth.user);

  // Initialize with static data
  useEffect(() => {
    setAiProviders(staticAIProviders);
  }, []);

  // Simple search filter
  const filterData = search
    ? aiProviders.filter((provider) =>
        provider.name.toLowerCase().includes(search.toLowerCase())
      )
    : aiProviders;

  // Handle adding a new AI provider
  const handleAddAIProvider = async (formData: FormData) => {
    setIsLoading(true);
    
    // TODO: Uncomment for API integration
    /*
    try {
      const response = await fetch('/api/ai-providers', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to add provider');
      
      const newProvider = await response.json();
      
      // Add notification
      // await fetch('/api/notifications', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     title: "New AI Provider Added",
      //     description: `New AI Provider Added`,
      //     status: "unread",
      //     userId: user?._id
      //   }),
      //   credentials: 'include',
      // });
      
      setAiProviders(prev => [...prev, newProvider]);
      message.success("AI provider added successfully!");
    } catch (error) {
      console.error("Failed to add AI provider:", error);
      message.error("Failed to add AI provider");
    }
    */
    
    // Static implementation
    try {
      // Extract data from FormData
      const name = formData.get('name') as string;
      const apiKey = formData.get('apiKey') as string;
      const price = parseFloat(formData.get('price') as string);
      const visible = formData.get('visible') === 'true';
      const pros = JSON.parse(formData.get('pros') as string || '[]');
      const cons = JSON.parse(formData.get('cons') as string || '[]');
      
      const newProvider: AIModel = {
        _id: Date.now().toString(),
        name,
        apiKey,
        price,
        visible,
        pros,
        cons,
        isActive: true,
        logoUrl: URL.createObjectURL(formData.get('image') as File || new Blob()),
      };
      
      setAiProviders(prev => [...prev, newProvider]);
      message.success("AI provider added successfully! (static mode)");
    } catch (error) {
      console.error("Static add failed:", error);
      message.error("Failed to add AI provider (static mode)");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle updating an AI provider
  const handleUpdateAIProvider = async (id: string, formData: FormData) => {
    setIsLoading(true);
    
    // TODO: Uncomment for API integration
    /*
    try {
      const response = await fetch(`/api/ai-providers/${id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to update provider');
      
      const updatedProvider = await response.json();
      
      // Add notification
      // await fetch('/api/notifications', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     title: "AI Provider Updated",
      //     description: "AI Provider Updated",
      //     status: "unread",
      //     userId: user?._id
      //   }),
      //   credentials: 'include',
      // });
      
      setAiProviders(prev => 
        prev.map(provider => 
          provider._id === id ? updatedProvider : provider
        )
      );
      message.success("AI provider updated successfully!");
    } catch (error) {
      console.error("Failed to update AI provider:", error);
      message.error("Failed to update AI provider");
    }
    */
    
    // Static implementation
    try {
      // Extract data from FormData
      const name = formData.get('name') as string;
      const apiKey = formData.get('apiKey') as string;
      const price = parseFloat(formData.get('price') as string);
      const visible = formData.get('visible') === 'true';
      const pros = JSON.parse(formData.get('pros') as string || '[]');
      const cons = JSON.parse(formData.get('cons') as string || '[]');
      
      const updatedProvider: AIModel = {
        _id: id,
        name,
        apiKey,
        price,
        visible,
        pros,
        cons,
        isActive: true,
        logoUrl: aiProviders.find(p => p._id === id)?.logoUrl,
      };
      
      setAiProviders(prev => 
        prev.map(provider => 
          provider._id === id ? updatedProvider : provider
        )
      );
      message.success("AI provider updated successfully! (static mode)");
    } catch (error) {
      console.error("Static update failed:", error);
      message.error("Failed to update AI provider (static mode)");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle toggling visibility
  const handleToggleVisibility = async (id: string) => {
    // TODO: Uncomment for API integration
    /*
    try {
      const response = await fetch(`/api/ai-providers/${id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to toggle visibility');
      
      // Add notification
      // await fetch('/api/notifications', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     title: "AI Provider Visibility Toggled",
      //     description: "AI Provider Visibility Toggled",
      //     status: "unread",
      //     userId: user?._id
      //   }),
      //   credentials: 'include',
      // });
      
      setAiProviders(prev => 
        prev.map(provider => 
          provider._id === id 
            ? { ...provider, visible: !provider.visible }
            : provider
        )
      );
      
      notification.success({
        message: "Success",
        description: "Visibility changed successfully.",
      });
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
      notification.error({
        message: "Error",
        description: "Failed to toggle visibility.",
      });
    }
    */
    
    // Static implementation
    setAiProviders(prev => 
      prev.map(provider => 
        provider._id === id 
          ? { ...provider, visible: !provider.visible }
          : provider
      )
    );
    
    notification.success({
      message: "Success",
      description: "Visibility changed successfully. (static mode)",
    });
  };

  // Handle removing an AI provider
  const handleRemoveAIProvider = async () => {
    if (!selectedAIProviderId) return;
    
    // TODO: Uncomment for API integration
    /*
    try {
      const response = await fetch(`/api/ai-providers/${selectedAIProviderId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to remove provider');
      
      // Add notification
      // await fetch('/api/notifications', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     title: "AI Provider Removed",
      //     description: "AI Provider Removed",
      //     status: "unread",
      //     userId: user?._id
      //   }),
      //   credentials: 'include',
      // });
      
      setAiProviders(prev => 
        prev.filter(provider => provider._id !== selectedAIProviderId)
      );
      
      setOpen(false);
      message.success("AI provider removed successfully!");
    } catch (error) {
      console.error("Failed to remove AI provider:", error);
      message.error("Failed to remove AI provider");
    }
    */
    
    // Static implementation
    setAiProviders(prev => 
      prev.filter(provider => provider._id !== selectedAIProviderId)
    );
    
    setOpen(false);
    message.success("AI provider removed successfully! (static mode)");
  };

  const columns: TableColumnsType<AIModel> = [
    {
      title: "AI Provider Name",
      dataIndex: "name",
      render: (text: string, record: AIModel) => (
        <div className="flex items-center md:w-full w-32">
          {record.logoUrl ? (
            <img
              src={record.logoUrl}
              alt={record.name}
              className="w-6 h-6 mr-2 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 mr-2 bg-gray-300 rounded-full" />
          )}
          <p className="mr-4 font-semibold">{text}</p>
          <EditAIProvider
            id={record._id}
            provider={record}
            onUpdate={handleUpdateAIProvider}
            loading={isLoading}
          />
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      render: (value: number) => (
        <div className="flex text-xs items-center">
          <PoundSterling className="mr-1 text-xs" size={15} />
          <p className="text-sm">{value}</p>
        </div>
      ),
    },
    {
      title: "Action",
      width: "15%",
      render: (value: any, record: AIModel) => (
        <Button
          type="primary"
          className="text-xs"
          danger
          onClick={() => {
            setSelectedAIProviderId(record._id);
            setOpen(true);
          }}
        >
          Remove
        </Button>
      ),
    },
    {
      title: "Visibility",
      dataIndex: "visible",
      render: (value: boolean, record: AIModel) => (
        <Switch
          checked={value}
          onChange={() => handleToggleVisibility(record._id)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col bg-white rounded-lg mt-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mx-2 my-3">
        <div className="col-span-1 md:col-span-2 justify-start">
          <p className="text-xl text-medium text-black">
            {aiProviders.length} AI Providers
          </p>
        </div>
        <div className="md:col-span-2 col-span-1">
          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            <div className="md:w-auto w-full">
              <CustomSearch onChange={(e:any) => setSearch(e)} value={search} />
            </div>
            <AddAIProvider onAdd={handleAddAIProvider} loading={isLoading} />
          </div>
        </div>
      </div>

      <div className="mt-3 mx-2">
        <Table
          columns={columns}
          dataSource={filterData}
          rowKey={(record:any) => record._id}
          loading={isLoading}
          className="rounded-md border border-grey mb-3 w-[calc(100% - 6px)]"
          scroll={{ x: true }}
        />
      </div>

      <Modal
        title={
          <div className="flex items-center">
            <Warning className="mr-3 text-[#FF4949] bg-[#FFE5E5] w-7 h-7 p-1 rounded-full" />
            <p>Remove AI Provider</p>
          </div>
        }
        open={open}
        onOk={handleRemoveAIProvider}
        onCancel={() => setOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="remove"
            type="primary"
            danger
            className="text-white"
            onClick={handleRemoveAIProvider}
            loading={isLoading}
          >
            Remove
          </Button>,
        ]}
      >
        <p className="py-3">
          Are you sure you want to remove this AI provider? Removing this AI
          provider will permanently erase it from the system.
        </p>
      </Modal>
    </div>
  );
}