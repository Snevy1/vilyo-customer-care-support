// components/ConversationHandoffControl.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ConversationHandoffControlProps {
  conversationId: string;
  initialIsHumanTakeover: boolean;
  onStatusChange?: (isHumanTakeover: boolean) => void;
}

export function ConversationHandoffControl({
  conversationId,
  initialIsHumanTakeover,
  onStatusChange,
}: ConversationHandoffControlProps) {
  const [isHumanTakeover, setIsHumanTakeover] = useState(initialIsHumanTakeover);
  const [isLoading, setIsLoading] = useState(false);

  const toggleHandoff = async () => {
    setIsLoading(true);
    try {
      const method = isHumanTakeover ? 'DELETE' : 'POST';
      const response = await fetch(
        `/api/admin/conversations/${conversationId}/handoff`,
        { method }
      );

      if (!response.ok) throw new Error('Failed to toggle handoff');

      const newStatus = !isHumanTakeover;
      setIsHumanTakeover(newStatus);
      onStatusChange?.(newStatus);

      toast.success(
        newStatus
          ? '✋ Human takeover enabled - bot will not respond'
          : '🤖 Bot re-enabled - AI will handle messages'
      );
    } catch (error) {
      console.error('Handoff toggle error:', error);
      toast.error('Failed to toggle handoff mode');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Badge variant={isHumanTakeover ? 'default' : 'secondary'}>
        {isHumanTakeover ? '👤 Human Mode' : '🤖 Bot Mode'}
      </Badge>
      
      <Button
        onClick={toggleHandoff}
        disabled={isLoading}
        variant={isHumanTakeover ? 'outline' : 'default'}
        size="sm"
      >
        {isLoading
          ? 'Switching...'
          : isHumanTakeover
          ? 'Release to Bot'
          : 'Take Over'}
      </Button>
    </div>
  );
}

// Example usage in your admin dashboard:
// <ConversationHandoffControl
//   conversationId={conversation.id}
//   initialIsHumanTakeover={conversation.is_human_takeover}
//   onStatusChange={(status) => console.log('New status:', status)}
// />