'use client';

import { useState, useRef } from 'react';
import { ConversationList, type ConversationListRef } from '@/components/conversation-list';
import { MessageView } from '@/components/message-view';

import { Settings, MessageSquare, Users, Bell, HelpCircle } from 'lucide-react';
import { ConversationHandoffControl } from '@/components/conversationalHandoff';

type Conversation = {
  id: string;
  phoneNumber: string;
  contactName?: string;
};

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

type ViewMode = 'conversations' | 'settings' | 'contacts' | 'notifications' | 'help';

const sidebarItems: SidebarItem[] = [
  { id: 'conversations', label: 'Conversations', icon: <MessageSquare size={20} /> },
  { id: 'contacts', label: 'Contacts', icon: <Users size={20} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  { id: 'help', label: 'Help & Support', icon: <HelpCircle size={20} /> },
];

export default function Home() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation>();
  const [activeView, setActiveView] = useState<ViewMode>('conversations');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const conversationListRef = useRef<ConversationListRef>(null);

  const handleTemplateSent = async (phoneNumber: string) => {
    const conversations = await conversationListRef.current?.refresh();
    if (conversations) {
      const conversation = conversations.find(conv => conv.phoneNumber === phoneNumber);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(undefined);
  };

  const handleSidebarItemClick = (itemId: string) => {
    setActiveView(itemId as ViewMode);
    // If switching away from conversations, deselect any conversation
    if (itemId !== 'conversations') {
      setSelectedConversation(undefined);
    }
  };

  // Render different content based on active view
  const renderMainContent = () => {
    switch (activeView) {
      case 'settings':
        return (
          <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
              
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Conversation Handoff Control
                </h2>
                <p className="text-gray-600 mb-4">
                  Manually control whether conversations are handled by AI or require human intervention.
                </p>
                
                {/* Example usage - you might want to fetch real conversation data here */}
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Conversation #12345</h3>
                    <ConversationHandoffControl
                      conversationId="12345"
                      initialIsHumanTakeover={false}
                      onStatusChange={(status) => console.log('Status changed:', status)}
                    />
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Conversation #67890</h3>
                    <ConversationHandoffControl
                      conversationId="67890"
                      initialIsHumanTakeover={true}
                      onStatusChange={(status) => console.log('Status changed:', status)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Add more settings sections as needed */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  General Settings
                </h2>
                {/* Add other settings components here */}
              </div>
            </div>
          </div>
        );

      case 'conversations':
      default:
        return (
          <>
            <ConversationList
              ref={conversationListRef}
              onSelectConversation={setSelectedConversation}
              selectedConversationId={selectedConversation?.id}
              isHidden={!!selectedConversation}
            />
            <MessageView
              conversationId={selectedConversation?.id}
              phoneNumber={selectedConversation?.phoneNumber}
              contactName={selectedConversation?.contactName}
              onTemplateSent={handleTemplateSent}
              onBack={handleBackToList}
              isVisible={!!selectedConversation}
            />
          </>
        );
    }
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar (unchanged) */}
      <div className={`flex flex-col ${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-gray-900 text-white transition-all duration-300`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-semibold">Messenger</h1>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div className={`transform transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Sidebar Items */}
        <div className="flex-1 p-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSidebarItemClick(item.id)}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'} rounded-lg mb-1 transition-colors ${
                activeView === item.id
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <span className={`${isSidebarCollapsed ? '' : 'mr-3'}`}>
                {item.icon}
              </span>
              {!isSidebarCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </div>

        {/* Sidebar Footer */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold">U</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">User Account</p>
                <p className="text-xs text-gray-400">user@example.com</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area - Now switches based on active view */}
      <div className="flex-1 flex">
        {renderMainContent()}
      </div>
    </div>
  );
}