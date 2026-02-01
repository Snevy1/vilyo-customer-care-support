// components/GoogleCalendarConnect.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Calendar, Check, AlertCircle } from 'lucide-react';

export function GoogleCalendarConnect({ orgId }: { orgId: string }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Generate state parameter for security
      const state = crypto.randomUUID();
      
      // Store state in session storage
      sessionStorage.setItem('google_auth_state', state);
      sessionStorage.setItem('google_auth_org', orgId);
      
      // Build OAuth URL
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        redirect_uri: `${window.location.origin}/api/auth/google/callback`,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
        access_type: 'offline',
        prompt: 'consent',
        state
      });
      
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      toast.error('Failed to connect to Google Calendar');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch(`/api/orgs/${orgId}/calendar/disconnect`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setIsConnected(false);
        toast.success('Disconnected from Google Calendar');
      }
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  const checkConnection = async () => {
    try {
      const response = await fetch(`/api/orgs/${orgId}/calendar/status`);
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (error) {
      setIsConnected(false);
    }
  };

  // Check connection on mount
  useState(() => {
    checkConnection();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to enable appointment booking
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span>Connected to Google Calendar</span>
            </div>
            <div className="text-sm text-gray-600">
              <p>• Appointment booking is enabled</p>
              <p>• Events will be created in your primary calendar</p>
              <p>• Google Meet links are automatically generated</p>
            </div>
            <Button variant="outline" onClick={handleDisconnect}>
              Disconnect Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <span>Calendar not connected</span>
            </div>
            <div className="text-sm text-gray-600">
              <p className="mb-2">Connect to enable features:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Check real-time availability</li>
                <li>Automatically create calendar events</li>
                <li>Send Google Meet links to customers</li>
                <li>Set up automatic reminders</li>
              </ul>
            </div>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}