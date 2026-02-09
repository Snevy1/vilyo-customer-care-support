// components/EscalationAlert.tsx
'use client';

import { useEffect } from 'react';
import { socket } from '@/lib/notifications/socket'
import { toast } from 'sonner';

interface EscalationAlertProps {
  orgId: string;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  playSound?: boolean; // Add this prop
}

export function EscalationAlert({ orgId, setUnreadCount, playSound = true }: EscalationAlertProps) {
  useEffect(() => {
    socket.connect();
    
    const handleEscalation = (data: any) => {
      toast.error(`🚨 HUMAN TAKEOVER REQUIRED: ${data.reason}`, {
        duration: 10000,
        description: `Customer is waiting in session ${data.sessionId?.slice(0, 8) || 'unknown'}`,
      });
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Play sound only if enabled
      if (playSound) {
        new Audio('/urgent-escalation.mp3').play().catch(e => console.log("Audio play failed:", e));
      }
    };

    socket.on(`org_${orgId}_escalation`, handleEscalation);

    return () => {
      socket.off(`org_${orgId}_escalation`, handleEscalation);
      socket.disconnect();
    };
  }, [orgId, setUnreadCount, playSound]); // Add playSound dependency

  return null;
}