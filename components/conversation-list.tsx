'use client';

import { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { format, isValid, isToday, isYesterday } from 'date-fns';
import { RefreshCw, Search, MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutoPolling } from '@/hooks/use-auto-polling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// --- Types ---
export type Conversation = {
  id: string;
  phoneNumber: string;
  status: string;
  lastActiveAt: string;
  phoneNumberId: string;
  metadata?: Record<string, unknown>;
  contactName?: string;
  messagesCount?: number;
  isHumanTakeover?: boolean;
  lastMessage?: {
    content: string;
    direction: string;
    type?: string;
  };
};

type Props = {
  onSelectConversation: (conversation: Conversation) => void;
  onDataLoaded?: (conversations: Conversation[]) => void;
  selectedConversationId?: string;
  isHidden?: boolean;
};

export type ConversationListRef = {
  refresh: () => Promise<Conversation[]>;
  selectByPhoneNumber: (phoneNumber: string) => void;
};

// --- Helpers ---
function formatConversationDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (!isValid(date)) return '';
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  } catch {
    return '';
  }
}

function getAvatarInitials(contactName?: string, phoneNumber?: string): string {
  if (contactName) {
    const words = contactName.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return contactName.slice(0, 2).toUpperCase();
  }
  return phoneNumber?.slice(-2) || '??';
}

// --- Component ---
export const ConversationList = forwardRef<ConversationListRef, Props>(
  ({ onSelectConversation, onDataLoaded, selectedConversationId, isHidden = false }, ref) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchConversations = useCallback(async () => {
      try {
        const response = await fetch('/api/whatsapp-api/conversations');
        const data = await response.json();
        const list = data.data || [];
        setConversations(list);
        
        // Push data to parent for Contacts/Settings syncing
        if (onDataLoaded) onDataLoaded(list);
        
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [onDataLoaded]);

    useEffect(() => {
      fetchConversations();
    }, [fetchConversations]);

    // Auto-polling (Every 10 seconds for real-time feel)
    const { isPolling } = useAutoPolling({
      interval: 10000,
      enabled: true,
      onPoll: fetchConversations
    });

    useImperativeHandle(ref, () => ({
      refresh: async () => {
        setRefreshing(true);
        const response = await fetch('/api/whatsapp-api/conversations');
        const data = await response.json();
        const list = data.data || [];
        setConversations(list);
        setRefreshing(false);
        if (onDataLoaded) onDataLoaded(list);
        return list;
      },
      selectByPhoneNumber: (phoneNumber: string) => {
        const conv = conversations.find(c => c.phoneNumber === phoneNumber);
        if (conv) onSelectConversation(conv);
      }
    }));

    const filteredConversations = conversations.filter((conv) => {
      const query = searchQuery.toLowerCase();
      return (
        conv.phoneNumber.toLowerCase().includes(query) ||
        conv.contactName?.toLowerCase().includes(query)
      );
    });

    if (loading) {
      return (
        <div className={cn("w-full md:w-96 border-r border-gray-100 bg-white flex flex-col", isHidden && "hidden md:flex")}>
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="flex-1 px-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 p-2">
                <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={cn(
        "w-full md:w-96 border-r border-gray-100 bg-white flex flex-col z-10 transition-all",
        isHidden && "hidden md:flex"
      )}>
        {/* Header Section */}
        <div className="p-6 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Messages</h1>
              {isPolling && (
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" title="Live sync active" />
              )}
            </div>
            <div className="flex gap-1">
              <Button
                onClick={() => fetchConversations()}
                disabled={refreshing}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
              >
                <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
              >
                <MessageSquarePlus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-11 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-2xl h-11 transition-all"
            />
          </div>
        </div>

        {/* List Section */}
        <ScrollArea className="flex-1">
          <div className="px-3 pb-6">
            {filteredConversations.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-400 font-medium">
                  {searchQuery ? 'No results found' : 'No messages yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => {
                  const isActive = selectedConversationId === conversation.id;
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => onSelectConversation(conversation)}
                      className={cn(
                        'w-full p-4 rounded-3xl flex gap-4 text-left transition-all duration-200 group relative',
                        isActive 
                          ? 'bg-blue-50 shadow-sm' 
                          : 'hover:bg-gray-50 border-transparent'
                      )}
                    >
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-600 rounded-r-full" />
                      )}

                      <Avatar className="h-14 w-14 shrink-0 rounded-2xl shadow-sm border-2 border-white">
                        <AvatarFallback className={cn(
                          "text-lg font-bold transition-colors",
                          isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                        )}>
                          {getAvatarInitials(conversation.contactName, conversation.phoneNumber)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className={cn(
                            "font-bold truncate transition-colors",
                            isActive ? "text-blue-900" : "text-gray-900"
                          )}>
                            {conversation.contactName || conversation.phoneNumber}
                          </h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0 ml-2">
                            {formatConversationDate(conversation.lastActiveAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {conversation.lastMessage ? (
                            <p className={cn(
                              "text-sm line-clamp-1 flex-1",
                              isActive ? "text-blue-700/80" : "text-gray-500"
                            )}>
                              {conversation.lastMessage.direction === 'outbound' && (
                                <span className="text-blue-500 font-bold mr-1">✓</span>
                              )}
                              {conversation.lastMessage.content}
                            </p>
                          ) : (
                            <p className="text-sm italic text-gray-300">No messages yet</p>
                          )}
                          
                          {/* Human Takeover Badge */}
                          {conversation.isHumanTakeover && (
                            <div className="h-2 w-2 rounded-full bg-amber-500 shadow-sm shadow-amber-200" title="Human Intervention" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }
);

ConversationList.displayName = 'ConversationList';