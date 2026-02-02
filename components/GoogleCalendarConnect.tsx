// components/GoogleCalendarConnect.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Calendar, Check, AlertCircle, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Common timezones for selection
const TIMEZONES = [
  { label: 'Nairobi (EAT)', value: 'Africa/Nairobi' },
  { label: 'London (GMT/BST)', value: 'Europe/London' },
  { label: 'New York (EST/EDT)', value: 'America/New_York' },
  { label: 'Los Angeles (PST/PDT)', value: 'America/Los_Angeles' },
  { label: 'Dubai (GST)', value: 'Asia/Dubai' },
];

export function GoogleCalendarConnect({ orgId }: { orgId: string }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {

      // 1. Save the selected timezone to the Org table first
      const tzResponse = await fetch(`/api/google/${orgId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ timezone }),
      });

      if (!tzResponse.ok) throw new Error("Failed to save timezone");
      // Generate state parameter for security
      const state = crypto.randomUUID();
      
      // Set cookies via document.cookie so the server can see them later
  document.cookie = `google_auth_state=${state}; path=/; max-age=3600; SameSite=Lax`;
  document.cookie = `google_auth_org=${orgId}; path=/; max-age=3600; SameSite=Lax`;
      
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
      const response = await fetch(`/api/google/${orgId}/settings`, {
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
  useEffect(() => {
  checkConnection();
}, [orgId]); 

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your business calendar to enable AI-powered bookings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timezone Selection: Critical for Multi-tenant */}
        {!isConnected && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Business Timezone
            </label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 italic">
              AI will use this timezone to show available slots to customers.
            </p>
          </div>
        )}

        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span>Connected & Syncing</span>
            </div>
            <Button variant="outline" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isConnecting ? 'Opening Google...' : 'Connect Google Calendar'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}