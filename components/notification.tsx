'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, MessageSquare, Bell, Webhook, TestTube2, Loader2, AlertCircle, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NotificationSettings {
  id?: string;
  organization_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  webhook_enabled: boolean;
  notification_phone?: string;
  notification_email?: string;
  webhook_url?: string;
  webhook_verification_status?: 'pending' | 'verified' | 'failed';
  webhook_last_delivered_at?: string;
  webhook_failure_count?: number;
}

export function NotificationPreferences({ orgId }: { orgId: string }) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [validatingUrl, setValidatingUrl] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [orgId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications`);
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      setSettings(data || {
        email_enabled: true,
        sms_enabled: false,
        webhook_enabled: false,
        organization_id: orgId
      });
    } catch (error) {
      toast.error("Failed to load notification settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const validateWebhookUrl = async (url: string): Promise<boolean> => {
    if (!url.trim()) return true;
    
    try {
      new URL(url);
      if (!url.startsWith('https://')) {
        toast.error("Webhook URL must use HTTPS for security");
        return false;
      }
      return true;
    } catch (error) {
      toast.error("Please enter a valid URL (e.g., https://hooks.slack.com/...)");
      return false;
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: any) => {
    if (!settings) return;

    // Special validation for webhook URL
    if (key === 'webhook_url' && value) {
      setValidatingUrl(true);
      const isValid = await validateWebhookUrl(value);
      setValidatingUrl(false);
      if (!isValid) return;
    }

    // If disabling webhook, clear the URL
    if (key === 'webhook_enabled' && value === false) {
      value = { webhook_enabled: false, webhook_url: '' };
      const newSettings = { ...settings, ...value };
      setSettings(newSettings);
    } else {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
    }

    try {
      const res = await fetch(`/api/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Update failed');
      }

      toast.success("Preferences updated");
      
      // If webhook URL was updated, test it automatically
      if (key === 'webhook_url' && value && settings?.webhook_enabled) {
        setTimeout(() => testWebhook(), 1000);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
      // Reload original settings
      loadSettings();
    }
  };

  const testWebhook = async () => {
    if (!settings?.webhook_url || !settings.webhook_enabled) {
      toast.error("Please enable webhook and enter a URL first");
      return;
    }

    setTestingWebhook(true);
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          webhook_url: settings.webhook_url,
          orgId 
        }),
      });

      const result = await res.json();
      
      if (result.success) {
        toast.success("Webhook test successful! Check your destination app.");
        // Update verification status
        setSettings(prev => prev ? {
          ...prev,
          webhook_verification_status: 'verified',
          webhook_last_delivered_at: new Date().toISOString()
        } : null);
      } else {
        toast.error(`Test failed: ${result.error || 'Unknown error'}`);
        setSettings(prev => prev ? {
          ...prev,
          webhook_verification_status: 'failed',
          webhook_failure_count: (prev.webhook_failure_count || 0) + 1
        } : null);
      }
    } catch (error) {
      toast.error("Test failed: Network error");
    } finally {
      setTestingWebhook(false);
    }
  };

  const getWebhookStatusBadge = () => {
    if (!settings?.webhook_url) return null;
    
    const status = settings.webhook_verification_status;
    const lastDelivered = settings.webhook_last_delivered_at;
    
    if (status === 'verified') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-2">
          <Check className="h-3 w-3 mr-1" /> Verified
        </Badge>
      );
    }
    
    if (status === 'failed') {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 ml-2">
          <X className="h-3 w-3 mr-1" /> Failed
        </Badge>
      );
    }
    
    if (lastDelivered) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-2">
          Active
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 ml-2">
        Not tested
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" /> Notification Channels
        </CardTitle>
        <CardDescription>
          Configure how you want to be notified about new leads and bookings.
          Changes are saved automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Email Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-medium">
                <Mail className="h-4 w-4" /> Email Notifications
              </div>
              <div className="text-xs text-muted-foreground">
                Send email alerts to your inbox
              </div>
            </div>
            <Switch 
              checked={settings?.email_enabled || false}
              onCheckedChange={(v) => updateSetting('email_enabled', v)}
              disabled={loading}
            />
          </div>

          {settings?.email_enabled && (
            <div className="space-y-2">
              <Label htmlFor="notification_email">Custom Email Address</Label>
              <Input
                id="notification_email"
                placeholder="notifications@yourcompany.com"
                value={settings.notification_email || ''}
                onChange={(e) => updateSetting('notification_email', e.target.value)}
                disabled={loading}
                type="email"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use your account email: {settings.notification_email || 'owner@email.com'}
              </p>
            </div>
          )}
        </div>

        {/* SMS Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-medium">
                <MessageSquare className="h-4 w-4" /> SMS Notifications
              </div>
              <div className="text-xs text-muted-foreground">
                Instant text messages via Twilio
              </div>
            </div>
            <Switch 
              checked={settings?.sms_enabled || false}
              onCheckedChange={(v) => updateSetting('sms_enabled', v)}
              disabled={loading}
            />
          </div>

          {settings?.sms_enabled && (
            <div className="space-y-2">
              <Label htmlFor="notification_phone">Phone Number</Label>
              <Input
                id="notification_phone"
                placeholder="+1234567890"
                value={settings.notification_phone || ''}
                onChange={(e) => updateSetting('notification_phone', e.target.value)}
                disabled={loading}
                type="tel"
              />
              <p className="text-xs text-muted-foreground">
                International format required (e.g., +1234567890)
              </p>
            </div>
          )}
        </div>

        {/* Webhook Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-medium">
                <Webhook className="h-4 w-4" /> Webhook Integration
                {getWebhookStatusBadge()}
              </div>
              <div className="text-xs text-muted-foreground">
                Send real-time data to external apps
              </div>
            </div>
            <Switch 
              checked={settings?.webhook_enabled || false}
              onCheckedChange={(v) => updateSetting('webhook_enabled', v)}
              disabled={loading}
            />
          </div>

          {settings?.webhook_enabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="webhook_url">Webhook URL</Label>
                  {(settings?.webhook_failure_count ?? 0) > 0 && (
                    <span className="text-xs text-red-600">
                 {settings.webhook_failure_count} recent failures
                    </span>
)}

                </div>
                <div className="flex gap-2">
                  <Input
                    id="webhook_url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={settings.webhook_url || ''}
                    onChange={(e) => updateSetting('webhook_url', e.target.value)}
                    disabled={loading || validatingUrl}
                    className="flex-1"
                    type="url"
                  />
                  <Button
                    onClick={testWebhook}
                    disabled={!settings.webhook_url || testingWebhook || loading}
                    variant="outline"
                    size="sm"
                  >
                    {testingWebhook ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube2 className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Test</span>
                  </Button>
                </div>
                
                {validatingUrl && (
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" /> Validating URL...
                  </p>
                )}
                
                {settings.webhook_url && (
                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground">
                      POST requests will be sent with this JSON structure:
                    </p>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`{
  "event": "booking.created",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "customer": "John Doe",
    "time": "2:00 PM",
    "service": "Consultation"
  }
}`}</pre>
                  </div>
                )}
              </div>

              {settings.webhook_last_delivered_at && (
                <div className="text-xs text-muted-foreground flex items-center">
                  <Check className="h-3 w-3 mr-1 text-green-600" />
                  Last successful delivery: {new Date(settings.webhook_last_delivered_at).toLocaleString()}
                </div>
              )}

              <div className="rounded-lg border p-3 bg-muted/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Popular Webhook Services</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                      <li>
                        <strong>Slack:</strong>{" "}
                        <code className="text-xs">https://hooks.slack.com/services/...</code>
                      </li>
                      <li>
                        <strong>Discord:</strong>{" "}
                        <code className="text-xs">https://discord.com/api/webhooks/...</code>
                      </li>
                      <li>
                        <strong>Zapier:</strong>{" "}
                        <code className="text-xs">https://hooks.zapier.com/hooks/...</code>
                      </li>
                      <li>
                        <strong>Make (Integromat):</strong>{" "}
                        <code className="text-xs">https://hook.make.com/...</code>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}