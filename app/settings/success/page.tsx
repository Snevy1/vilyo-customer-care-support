'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GoogleCalendarConnect } from '@/components/GoogleCalendarConnect';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Settings2 } from 'lucide-react';

function SettingsContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  
  // Replace this with your actual session orgId
  const orgId = "org_111211041353892620"; 

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Settings</h1>
        <p className="text-muted-foreground">Manage your AI integrations and calendar availability.</p>
      </div>

      {success === 'calendar_connected' && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">Google Calendar successfully connected!</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Calendar Integration Card */}
        <GoogleCalendarConnect orgId={orgId} />

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>Real-time automation status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">AI Booking Agent</span>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Active</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">M-Pesa Integration</span>
              <Badge variant="outline">Pending Setup</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}