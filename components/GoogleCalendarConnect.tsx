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
      const tzResponse = await fetch(`/api/auth/google/${orgId}/settings`, {
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
  // ADDED openid and userinfo.email below
  scope: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
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
      const response = await fetch(`/api/auth/google/${orgId}/settings`, {
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
      const response = await fetch(`/api/organization/google/${orgId}/calendar/status`);
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

        <CardContent className="space-y-6">
  {isConnected ? (
    <div className="space-y-6">
      {/* Success Status */}
      <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
        <Check className="h-5 w-5" />
        <span className="font-medium">Connected & Syncing</span>
      </div>

      {/* Onboarding Guide for "User B" */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          How to manage your bookings:
        </h4>
        <ul className="text-xs text-slate-600 space-y-3">
          <li className="flex gap-2">
            <span className="font-bold text-blue-600">1.</span>
            <span>Your assistant is currently set to book you between <strong>9:00 AM - 5:00 PM</strong>.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-600">2.</span>
            <span>To block time (breaks, meetings, holidays), simply add a <strong>"Busy"</strong> event to your Google Calendar.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-600">3.</span>
            <span>Fiona will automatically see those blocks and never double-book you.</span>
          </li>
        </ul>
        <Button 
          variant="link" 
          className="p-0 h-auto text-xs text-blue-600 hover:text-blue-700"
          onClick={() => window.open('https://calendar.google.com', '_blank')}
        >
          Open Google Calendar &rarr;
        </Button>
      </div>

      <div className="pt-2">
        <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-red-600 hover:text-red-700 hover:bg-red-50">
          Disconnect Calendar
        </Button>
      </div>
    </div>
  ) : (
    <div className="space-y-4">
      {/* ... (Your existing timezone selector code here) ... */}
      
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isConnecting ? 'Opening Google...' : 'Connect Google Calendar'}
      </Button>
      <p className="text-[10px] text-center text-slate-400">
        You will be redirected to Google to authorize access.
      </p>
    </div>
  )}
</CardContent>
      </CardContent>
    </Card>
  );
}