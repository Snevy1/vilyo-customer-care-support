// components/EscalationAlert.tsx
'use client';

import { useEffect } from 'react';
import { socket } from '@/lib/notifications/socket'
import { toast } from 'sonner';

export function EscalationAlert({ orgId }: { orgId: string }) {
  useEffect(() => {
    socket.connect();
    
    // Listen for this specific organization's escalations
    socket.on(`org_${orgId}_escalation`, (data) => {
      toast.error(`🚨 HUMAN TAKEOVER REQUIRED: ${data.reason}`, {
        duration: 10000,
        description: `Customer is waiting in session ${data.sessionId.slice(0,8)}`,
      });
      // Optionally play a notification sound
      new Audio('/urgent-escalation.mp3').play().catch(e => console.log("Audio play failed:", e));
    });

    return () => {
      socket.off(`org_${orgId}_escalation`);
      socket.disconnect();
    };
  }, [orgId]);

  return null; // This is a logic-only component
}