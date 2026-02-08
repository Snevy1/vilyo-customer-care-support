'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { format, isValid, isToday, isYesterday, differenceInHours } from 'date-fns';
import { 
  RefreshCw, Paperclip, Send, X, AlertCircle, MessageSquare, 
  XCircle, ListTree, ArrowLeft, Mic, Smile, MoreVertical, 
  Phone, Video, Search, Image as ImageIcon, FileText,
  Check, CheckCheck, Clock, Volume2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaMessage } from '@/components/media-message';
import { TemplateSelectorDialog } from '@/components/template-selector-dialog';
import { InteractiveMessageDialog } from '@/components/interactive-message-dialog';
import { useAutoPolling } from '@/hooks/use-auto-polling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { MediaData } from '@kapso/whatsapp-cloud-api';

type Message = {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  phoneNumber: string;
  hasMedia: boolean;
  mediaData?: {
    url: string;
    contentType?: string;
    filename?: string;
  } | (MediaData & { url: string });
  reactionEmoji?: string | null;
  reactedToMessageId?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  messageType?: string;
  caption?: string | null;
  metadata?: {
    mediaId?: string;
    caption?: string;
  };
};

function formatMessageTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (isValid(date)) {
      return format(date, 'HH:mm');
    }
    return '';
  } catch {
    return '';
  }
}

function formatDateDivider(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (!isValid(date)) return '';

    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  } catch {
    return '';
  }
}

function shouldShowDateDivider(currentMsg: Message, prevMsg: Message | null): boolean {
  if (!prevMsg) return true;

  try {
    const currentDate = new Date(currentMsg.createdAt);
    const prevDate = new Date(prevMsg.createdAt);

    if (!isValid(currentDate) || !isValid(prevDate)) return false;

    return format(currentDate, 'yyyy-MM-dd') !== format(prevDate, 'yyyy-MM-dd');
  } catch {
    return false;
  }
}

function isWithin24HourWindow(messages: Message[]): boolean {
  const inboundMessages = messages.filter(msg => msg.direction === 'inbound');
  if (inboundMessages.length === 0) return false;

  const lastInboundMessage = inboundMessages[inboundMessages.length - 1];
  try {
    const lastMessageDate = new Date(lastInboundMessage.createdAt);
    if (!isValid(lastMessageDate)) return false;

    const hoursSinceLastMessage = differenceInHours(new Date(), lastMessageDate);
    return hoursSinceLastMessage < 24;
  } catch {
    return false;
  }
}

function getDisabledInputMessage(messages: Message[]): string {
  const inboundMessages = messages.filter(msg => msg.direction === 'inbound');
  if (inboundMessages.length === 0) {
    return "Send a template message to start the conversation";
  }
  return "Conversation window expired. Send a template message to continue.";
}

type Props = {
  conversationId?: string;
  phoneNumber?: string;
  contactName?: string;
  onTemplateSent?: (phoneNumber: string) => Promise<void>;
  onBack?: () => void;
  isVisible?: boolean;
};

export function MessageView({ conversationId, phoneNumber, contactName, onTemplateSent, onBack, isVisible = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [canSendRegularMessage, setCanSendRegularMessage] = useState(true);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showInteractiveDialog, setShowInteractiveDialog] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const previousMessageCountRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/whatsapp-api/messages/${conversationId}`);
      const data = await response.json();

      const reactions = (data.data || []).filter((msg: Message) => msg.messageType === 'reaction');
      const regularMessages = (data.data || []).filter((msg: Message) => msg.messageType !== 'reaction');

      const reactionMap = new Map<string, string>();
      reactions.forEach((reaction: Message) => {
        if (reaction.reactedToMessageId && reaction.reactionEmoji) {
          reactionMap.set(reaction.reactedToMessageId, reaction.reactionEmoji);
        }
      });

      const messagesWithReactions = regularMessages.map((msg: Message) => {
        const reaction = reactionMap.get(msg.id);
        return reaction ? { ...msg, reactionEmoji: reaction } : msg;
      });

      const sortedMessages = messagesWithReactions.sort((a: Message, b: Message) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      setMessages(sortedMessages);
      previousMessageCountRef.current = sortedMessages.length;
      
      // Simulate typing indicator
      if (sortedMessages.length > 0 && sortedMessages[sortedMessages.length - 1].direction === 'outbound') {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 1500);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      setLoading(true);
      fetchMessages();
    }
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, isNearBottom, scrollToBottom]);

  useEffect(() => {
    setCanSendRegularMessage(isWithin24HourWindow(messages));
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const viewport = container.querySelector('[data-radix-scroll-area-viewport]');
      if (!viewport) return;

      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setIsNearBottom(distanceFromBottom < 100);
    };

    const viewport = container.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.addEventListener('scroll', handleScroll);
      return () => viewport.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  useAutoPolling({
    interval: 5000,
    enabled: !!conversationId,
    onPoll: fetchMessages
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !selectedFile) || !phoneNumber || sending) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('to', phoneNumber);
      if (messageInput.trim()) formData.append('body', messageInput);
      if (selectedFile) formData.append('file', selectedFile);

      await fetch('/api/whatsapp-api/messages/send', {
        method: 'POST',
        body: formData
      });

      setMessageInput('');
      handleRemoveFile();
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSent = async () => {
    await fetchMessages();
    if (phoneNumber && onTemplateSent) {
      await onTemplateSent(phoneNumber);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sent': return <Check className="h-3.5 w-3.5 text-gray-400" />;
      case 'delivered': return <CheckCheck className="h-3.5 w-3.5 text-gray-400" />;
      case 'read': return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
      case 'failed': return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      default: return <Clock className="h-3.5 w-3.5 text-gray-300" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!conversationId) {
    return (
      <div className={cn(
        "flex-1 flex flex-col items-center justify-center bg-linear-to-b from-[#f8f9fa] to-[#e9ecef]",
        !isVisible && "hidden md:flex"
      )}>
        <div className="text-center space-y-4 p-8">
          <div className="relative">
            <div className="w-24 h-24 mx-auto rounded-full bg-linear-to-br from-[#00a884] to-[#128c7e] flex items-center justify-center">
              <MessageSquare className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white border-4 border-[#f8f9fa] flex items-center justify-center shadow-lg">
              <Volume2 className="h-5 w-5 text-[#00a884]" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">WhatsApp Business</h3>
            <p className="text-gray-500 max-w-md">
              Select a conversation to start messaging. Send templates, media, and interactive messages to engage with your customers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn(
        "flex-1 flex flex-col bg-linear-to-b from-[#efeae2] via-[#f5f2eb] to-[#efeae2]",
        !isVisible && "hidden md:flex"
      )}>
        <div className="p-4 border-b border-[#d1d7db] bg-linear-to-r from-[#f0f2f5] to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {onBack && (
                <Button
                  onClick={onBack}
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-[#667781] hover:bg-[#e8e9ec] rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={cn('flex gap-2', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
                {i % 2 !== 0 && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
                <div className={cn(
                  'max-w-[70%] rounded-2xl px-4 py-3',
                  i % 2 === 0 ? 'bg-[#d9fdd3] rounded-br-none' : 'bg-white rounded-bl-none'
                )}>
                  <Skeleton className="h-4 mb-2" style={{ width: `${Math.random() * 200 + 100}px` }} />
                  <div className="flex items-center justify-end gap-1">
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
                {i % 2 === 0 && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex-1 flex flex-col bg-linear-to-b from-[#efeae2] via-[#f5f2eb] to-[#efeae2]",
      !isVisible && "hidden md:flex"
    )}>
      {/* Header */}
      <div className="p-3 border-b border-[#d1d7db] bg-linear-to-r from-[#f0f2f5] to-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {onBack && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onBack}
                      variant="ghost"
                      size="icon"
                      className="md:hidden text-[#667781] hover:bg-[#e8e9ec] rounded-full"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Back to conversations</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${contactName || phoneNumber}&background=00a884&color=fff`} />
              <AvatarFallback className="bg-linear-to-br from-[#00a884] to-[#128c7e] text-white">
                {getInitials(contactName || phoneNumber || 'U')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#111b21] truncate">
                  {contactName || phoneNumber || 'Conversation'}
                </h2>
                {isTyping && (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>
              {contactName && phoneNumber && (
                <p className="text-xs text-[#667781] truncate">{phoneNumber}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#667781] hover:bg-[#e8e9ec] rounded-full">
                    <Phone className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voice call</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#667781] hover:bg-[#e8e9ec] rounded-full">
                    <Video className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Video call</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#667781] hover:bg-[#e8e9ec] rounded-full">
                    <Search className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search messages</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    variant="ghost"
                    size="icon"
                    className="text-[#667781] hover:bg-[#e8e9ec] rounded-full"
                  >
                    <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh messages</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[#667781] hover:bg-[#e8e9ec] rounded-full">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>View contact info</DropdownMenuItem>
                <DropdownMenuItem>Export chat</DropdownMenuItem>
                <DropdownMenuItem>Clear chat</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Block contact</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={messagesContainerRef} className="flex-1 h-0">
        <div className="p-4 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-linear-to-br from-[#00a884]/10 to-[#128c7e]/10 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-[#00a884]" />
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-1">No messages yet</h3>
                <p className="text-sm text-gray-500">Send your first message to start the conversation</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showDateDivider = shouldShowDateDivider(message, prevMessage);
              const isOutbound = message.direction === 'outbound';

              return (
                <div key={message.id}>
                  {showDateDivider && (
                    <div className="flex justify-center my-6">
                      <Badge 
                        variant="secondary" 
                        className="shadow-sm bg-white/80 backdrop-blur-sm text-xs font-normal px-3 py-1"
                      >
                        {formatDateDivider(message.createdAt)}
                      </Badge>
                    </div>
                  )}

                  <div className={cn('flex gap-2 mb-3', isOutbound ? 'justify-end' : 'justify-start')}>
                    {!isOutbound && (
                      <Avatar className="h-8 w-8 border border-white/50 shadow-xs">
                        <AvatarFallback className="bg-linear-to-br from-gray-400 to-gray-600 text-white text-xs">
                          {getInitials(message.phoneNumber)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={cn(
                      'group relative max-w-[70%] rounded-2xl px-4 py-3 shadow-sm',
                      isOutbound
                        ? 'bg-linear-to-r from-[#d9fdd3] to-[#c6f7c4] text-[#111b21] rounded-br-none'
                        : 'bg-white text-[#111b21] rounded-bl-none border border-white/50'
                    )}>
                      {/* Media Content */}
                      {message.hasMedia && message.mediaData?.url ? (
                        <div className="mb-2 overflow-hidden rounded-lg">
                          {message.messageType === 'sticker' ? (
                            <img
                              src={message.mediaData.url}
                              alt="Sticker"
                              className="max-w-37.5 max-h-37.5 h-auto"
                            />
                          ) : message.mediaData.contentType?.startsWith('image/') || message.messageType === 'image' ? (
                            <div className="relative group">
                              <img
                                src={message.mediaData.url}
                                alt="Media"
                                className="rounded-lg max-w-full h-auto max-h-96 hover:scale-[1.02] transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                            </div>
                          ) : message.mediaData.contentType?.startsWith('video/') || message.messageType === 'video' ? (
                            <video
                              src={message.mediaData.url}
                              controls
                              className="rounded-lg max-w-full h-auto max-h-96"
                            />
                          ) : message.mediaData.contentType?.startsWith('audio/') || message.messageType === 'audio' ? (
                            <div className="bg-linear-to-r from-[#00a884]/10 to-[#128c7e]/10 rounded-lg p-3">
                              <audio src={message.mediaData.url} controls className="w-full" />
                            </div>
                          ) : (
                            <a
                              href={message.mediaData.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-lg hover:opacity-90 transition-all',
                                isOutbound ? 'bg-white/20' : 'bg-gray-50'
                              )}
                            >
                              <FileText className={cn(
                                'h-8 w-8',
                                isOutbound ? 'text-[#00a884]' : 'text-gray-600'
                              )} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {message.mediaData.filename || message.filename || 'Document'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {message.mediaData.contentType?.split('/')[1]?.toUpperCase() || 'FILE'}
                                </p>
                              </div>
                              <Button size="sm" variant="ghost" className="text-xs">
                                Download
                              </Button>
                            </a>
                          )}
                        </div>
                      ) : message.metadata?.mediaId && message.messageType ? (
                        <div className="mb-2">
                          <MediaMessage
                            mediaId={message.metadata.mediaId}
                            messageType={message.messageType}
                            caption={message.caption}
                            filename={message.filename}
                            isOutbound={isOutbound}
                          />
                        </div>
                      ) : null}

                      {/* Text Content */}
                      {message.caption && (
                        <p className="text-sm whitespace-pre-wrap mb-1 leading-relaxed">
                          {message.caption}
                        </p>
                      )}

                      {message.content && message.content !== '[Image attached]' && (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      )}

                      {/* Message Footer */}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] text-[#667781]">
                          {formatMessageTime(message.createdAt)}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {message.messageType && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {message.messageType}
                            </Badge>
                          )}
                          
                          {isOutbound && message.status && (
                            <div className="flex items-center gap-0.5">
                              {getStatusIcon(message.status)}
                              {message.status === 'failed' && (
                                <span className="text-[10px] text-red-500 ml-0.5">Failed</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reaction */}
                      {message.reactionEmoji && (
                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full px-2 py-0.5 text-sm shadow-md border border-gray-100">
                          {message.reactionEmoji}
                        </div>
                      )}

                      {/* Message Actions */}
                      <div className={cn(
                        'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
                        isOutbound ? '-left-10' : '-right-10'
                      )}>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                          <Smile className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isOutbound && (
                      <Avatar className="h-8 w-8 border border-white/50 shadow-xs">
                        <AvatarFallback className="bg-linear-to-br from-[#00a884] to-[#128c7e] text-white text-xs">
                          You
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              );
            })
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-2 mb-3">
              <Avatar className="h-8 w-8 border border-white/50 shadow-xs">
                <AvatarFallback className="bg-linear-to-br from-gray-400 to-gray-600 text-white text-xs">
                  {getInitials(contactName || phoneNumber || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#00a884] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#00a884] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-[#00a884] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-[#d1d7db] bg-linear-to-r from-[#f0f2f5] to-white">
        {/* File Preview */}
        {selectedFile && (
          <div className="p-3 border-b border-[#d1d7db] bg-white/90 backdrop-blur-sm">
            <div className="flex items-center gap-3 max-w-3xl mx-auto">
              {filePreview ? (
                <div className="relative">
                  <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent rounded-lg" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-linear-to-br from-[#00a884]/10 to-[#128c7e]/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-8 w-8 text-[#00a884]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111b21] truncate">{selectedFile.name}</p>
                <p className="text-xs text-[#667781]">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button
                onClick={handleRemoveFile}
                type="button"
                variant="ghost"
                size="icon"
                className="text-[#667781] hover:bg-red-50 hover:text-red-500 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Message Input Form */}
        {canSendRegularMessage ? (
          <form onSubmit={handleSendMessage} className="p-3 max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                    />
                  </TooltipTrigger>
                  <TooltipContent>Attach file</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending}
                      variant="ghost"
                      size="icon"
                      className="text-[#667781] hover:text-[#00a884] hover:bg-[#e8e9ec] rounded-full transition-all"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach file</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      onClick={() => setShowInteractiveDialog(true)}
                      disabled={sending}
                      size="icon"
                      variant="ghost"
                      className="text-[#667781] hover:text-[#00a884] hover:bg-[#e8e9ec] rounded-full transition-all"
                    >
                      <ListTree className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Interactive message</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex-1 relative">
                <Input
                  ref={messageInputRef}
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending}
                  className="pl-4 pr-12 h-12 text-[#111b21] bg-white border-[#d1d7db] focus-visible:ring-2 focus-visible:ring-[#00a884] rounded-full shadow-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#667781] hover:text-[#00a884] rounded-full"
                  onClick={() => {
                    // Emoji picker would go here
                    messageInputRef.current?.focus();
                  }}
                >
                  <Smile className="h-5 w-5" />
                </Button>
              </div>

              {messageInput.trim() || selectedFile ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        disabled={sending}
                        size="icon"
                        className="bg-linear-to-r from-[#00a884] to-[#128c7e] hover:from-[#008f6f] hover:to-[#0e7a69] rounded-full shadow-lg hover:shadow-xl transition-all"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send message</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-[#667781] hover:text-[#00a884] hover:bg-[#e8e9ec] rounded-full"
                      >
                        <Mic className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Voice message</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </form>
        ) : (
          <div className="p-4 max-w-3xl mx-auto">
            <div className="bg-linear-to-r from-yellow-50 to-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="bg-linear-to-br from-amber-500 to-yellow-500 p-2 rounded-full">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-900 mb-2">
                    {getDisabledInputMessage(messages)}
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => setShowTemplateDialog(true)}
                      className="bg-linear-to-r from-[#00a884] to-[#128c7e] hover:from-[#008f6f] hover:to-[#0e7a69]"
                      size="sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send template message
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      Learn more
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <TemplateSelectorDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        phoneNumber={phoneNumber || ''}
        onTemplateSent={handleTemplateSent}
      />

      <InteractiveMessageDialog
        open={showInteractiveDialog}
        onOpenChange={setShowInteractiveDialog}
        conversationId={conversationId}
        phoneNumber={phoneNumber}
        onMessageSent={fetchMessages}
      />
    </div>
  );
}