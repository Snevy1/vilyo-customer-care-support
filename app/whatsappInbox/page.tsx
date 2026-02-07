'use client';

import { useState, useRef, useEffect } from 'react';
import { ConversationList, type ConversationListRef } from '@/components/conversation-list';
import { MessageView } from '@/components/message-view';
import { Settings, MessageSquare, Users, Bell, HelpCircle, Search, UserPlus, Flame, Ticket, Info, Calendar } from 'lucide-react';
import { ConversationHandoffControl } from '@/components/conversationalHandoff';
import { EscalationAlert } from '@/components/escalationAlert';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- Types ---
type Conversation = {
  id: string;
  phoneNumber: string;
  contactName?: string;
  isHumanTakeover?: boolean;
};

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

type ViewMode = 'conversations' | 'settings' | 'contacts' | 'notifications' | 'help';

type ActivityType = 'HOT_LEAD' | 'APPOINTMENT' | 'ESCALATION' | 'SYSTEM';

interface ActivityItem {
  id: string;
  sessionId?: string; // Add this line
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

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
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const conversationListRef = useRef<ConversationListRef>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);


  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const orgId = "org_109983504854417672"; // This should come from your session/context

  // --- Logic to sync local state with the ConversationList child ---
  const handleConversationSelect = (conv: Conversation) => {
    setSelectedConversation(conv);
    setActiveView('conversations');
  };

  const handleTemplateSent = async (phoneNumber: string) => {
    const conversations = await conversationListRef.current?.refresh();
    if (conversations) {
      setAllConversations(conversations);
      const conversation = conversations.find(conv => conv.phoneNumber === phoneNumber);
      if (conversation) setSelectedConversation(conversation);
    }
  };

  const handleSidebarItemClick = (itemId: string) => {
    setActiveView(itemId as ViewMode);
    if (itemId !== 'conversations') setSelectedConversation(undefined);
  };


  const handleReleaseBackToBot = async (sessionId: string) => {
  try {
    const res = await fetch(`/api/admin/conversations/${sessionId}/handoff`, {
      method: 'DELETE',
    });
    if (res.ok) {
      // Refresh the local activity list or toast success
      setActivities(prev => prev.map(a => 
        a.sessionId === sessionId ? { ...a, read: true } : a
      ));
      toast.success("Conversation released back to Fiona!");
    }
  } catch (err) {
    toast.error("Failed to release conversation.");
  }
};

  useEffect(() => {
    setActivities([
      {
        id: '1',
        type: 'HOT_LEAD',
        title: 'High Intent Lead Captured',
        description: 'Wanyama expressed interest in "Pricing". Lead Score: 92/100',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        type: 'APPOINTMENT',
        title: 'New Demo Scheduled',
        description: 'John Doe booked a consultation for Tomorrow at 10:00 AM',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: true
      },
      {
        id: '3',
        type: 'ESCALATION',
        title: 'Human Intervention Requested',
        description: 'Fiona could not resolve a technical query for +254746...',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        read: true
      }
    ]);
  }, []);
  

  // Fetch unread...

  useEffect(() => {
  const checkUnread = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      // Count items where is_read is false
      const count = data.feed?.filter((n: any) => !n.is_read).length || 0;
      setUnreadCount(count);
    } catch (e) {
      console.error("Failed to fetch unread count", e);
    }
  };
  checkUnread();
}, [activeView]); // Re-check when user switches views
  // --- View Renderers ---

  const renderContactsView = () => {
    // Derived from conversations where a contact name exists
    const contacts = allConversations.filter(c => c.contactName);

    return (
      <div className="flex-1 bg-gray-50 flex flex-col">
        <header className="bg-white border-b p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
            <UserPlus size={18} /> Add Contact
          </button>
        </header>
        
        <div className="p-6 max-w-5xl w-full mx-auto">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {contacts.length > 0 ? contacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{contact.contactName}</td>
                    <td className="px-6 py-4 text-gray-600">{contact.phoneNumber}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleConversationSelect(contact)}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Message
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                      No contacts found from your WhatsApp history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };


const renderSettingsView = () => (
  <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      
      <section className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Global Bot Control</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Overview of all currently active human interventions. Toggle off to let Fiona resume.
        </p>
        
        <div className="space-y-4">
          {allConversations.filter(c => c.isHumanTakeover).map(conv => (
            <div key={conv.id} className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-semibold text-amber-900">{conv.contactName || conv.phoneNumber}</p>
                <p className="text-xs text-amber-700 italic">Human Agent is replying...</p>
              </div>
              <ConversationHandoffControl
                conversationId={conv.id}
                initialIsHumanTakeover={true}
                onStatusChange={(status) => console.log(`ID ${conv.id} changed to`, status)}
              />
            </div>
          ))}
          {allConversations.filter(c => c.isHumanTakeover).length === 0 && (
            <p className="text-gray-400 text-sm italic text-center py-4">No active human takeovers.</p>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Notification Preferences</h2>
        
        {/* Escalation Sound Toggle */}
        <div className="flex justify-between items-center py-4 border-b">
          <div>
            <p className="font-semibold text-gray-800">Escalation Sound Alerts</p>
            <p className="text-xs text-gray-500">Play a sound when a human takeover is required.</p>
          </div>
          <button 
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={cn(
              "w-12 h-6 rounded-full transition-all relative",
              isSoundEnabled ? "bg-blue-600" : "bg-gray-200"
            )}
          >
            <div className={cn(
              "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
              isSoundEnabled ? "right-1" : "left-1"
            )} />
          </button>
        </div>
        
        {/* Other notification preferences */}
        <div className="space-y-4 opacity-50 cursor-not-allowed pt-4">
          {['Email Alerts', 'Browser Push', 'WhatsApp Status Updates'].map(item => (
            <div key={item} className="flex justify-between items-center py-2 border-b last:border-0">
              <span className="text-gray-700">{item}</span>
              <div className="w-10 h-5 bg-gray-300 rounded-full"></div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-blue-600 font-medium">Coming soon in Premium Tier</p>
      </section>
    </div>
  </div>
);

 const renderNotificationsView = () => {
    return (
      <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
        {/* Real-time Socket Listener */}
        <EscalationAlert orgId={orgId} setUnreadCount={setUnreadCount}  playSound={isSoundEnabled}  />

        <header className="bg-white border-b px-8 py-6">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Activity Feed</h1>
              <p className="text-slate-500 text-sm">Real-time updates from Fiona and your customers.</p>
            </div>
            <button 
              onClick={() => setActivities(prev => prev.map(a => ({ ...a, read: true })))}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Mark all as read
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className={cn(
                    "group relative bg-white p-5 rounded-3xl border transition-all duration-300 hover:shadow-md",
                    !activity.read ? "border-blue-100 bg-blue-50/30" : "border-slate-100"
                  )}
                >
                  <div className="flex gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                      activity.type === 'HOT_LEAD' ? "bg-orange-100 text-orange-600" :
                      activity.type === 'ESCALATION' ? "bg-red-100 text-red-600" :
                      activity.type === 'APPOINTMENT' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {activity.type === 'HOT_LEAD' && <Flame size={20} />}
                      {activity.type === 'ESCALATION' && <Ticket size={20} />}
                      {activity.type === 'APPOINTMENT' && <Calendar size={20} />}
                      {activity.type === 'SYSTEM' && <Info size={20} />}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-slate-900">{activity.title}</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{activity.description}</p>
                    </div>
                    
                  </div>
                  
                  {!activity.read && (
                    <div className="absolute top-5 right-2 w-2 h-2 bg-blue-600 rounded-full" />
                  )}

                  {activity.type === 'ESCALATION' && activity.sessionId && (
  <button
    onClick={() => handleReleaseBackToBot(activity.sessionId!)}
    className="mt-3 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
  >
    Resolve & Release to Fiona
  </button>
)}
                </div>
                
              ))

              
            ) : (
              <div className="text-center py-20">
                <Bell className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-medium">No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  // --- Main Render ---
  return (
    <div className="h-screen flex bg-white font-sans text-gray-900">
      {/* Sidebar */}
      <aside className={`flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-950 text-white transition-all duration-500 ease-in-out z-20`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          {!isSidebarCollapsed && <h1 className="text-2xl font-black tracking-tighter text-blue-500">VILYO</h1>}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-slate-800 rounded-xl transition-all">
            <div className={`transform transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-180' : ''}`}>
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" /></svg>
            </div>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => (
  <button
    key={item.id}
    onClick={() => handleSidebarItemClick(item.id)}
    className={cn(
      "w-full flex items-center rounded-2xl transition-all",
      activeView === item.id ? "bg-blue-600 shadow-lg" : "text-slate-400 hover:text-white",
      isSidebarCollapsed ? "justify-center py-4" : "px-4 py-3"
    )}
  >
    <div className="relative">
      {item.icon}
      
      {/* THE RED BADGE */}
      {item.id === 'notifications' && unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-slate-950 animate-in zoom-in duration-300">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>

    {!isSidebarCollapsed && (
      <span className="ml-4 font-semibold">{item.label}</span>
    )}
  </button>
))}
        </nav>

        {!isSidebarCollapsed && (
          <div className="p-6 m-4 bg-slate-900 rounded-3xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center font-bold">U</div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">Admin Portal</p>
                <p className="text-xs text-slate-500 truncate">admin@vilyo.ai</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeView === 'conversations' ? (
          <>
            <ConversationList
              ref={conversationListRef}
              onSelectConversation={handleConversationSelect}
              selectedConversationId={selectedConversation?.id}
              isHidden={!!selectedConversation}
              onDataLoaded={setAllConversations}
            />
            <MessageView
              conversationId={selectedConversation?.id}
              phoneNumber={selectedConversation?.phoneNumber}
              contactName={selectedConversation?.contactName}
              onTemplateSent={handleTemplateSent}
              onBack={() => setSelectedConversation(undefined)}
              isVisible={!!selectedConversation}
            />
          </>
        ) : activeView === 'settings' ? renderSettingsView() 
          : activeView === 'contacts' ? renderContactsView()
          : activeView === 'notifications' ? renderNotificationsView()
          : <div className="p-10">Help section coming soon.</div>
        }
      </main>
    </div>
  );
}