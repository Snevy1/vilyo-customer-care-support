'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare, Webhook, TestTube2, Loader2, AlertCircle, Check, X } from 'lucide-react';

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
  const [saveSuccess, setSaveSuccess] = useState(false);

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
        return false;
      }
      return true;
    } catch (error) {
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

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // If webhook URL was updated, test it automatically
      if (key === 'webhook_url' && value && settings?.webhook_enabled) {
        setTimeout(() => testWebhook(), 1000);
      }
    } catch (error: any) {
      // Reload original settings
      loadSettings();
    }
  };

  const testWebhook = async () => {
    if (!settings?.webhook_url || !settings.webhook_enabled) {
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
        setSettings(prev => prev ? {
          ...prev,
          webhook_verification_status: 'verified',
          webhook_last_delivered_at: new Date().toISOString()
        } : null);
      } else {
        setSettings(prev => prev ? {
          ...prev,
          webhook_verification_status: 'failed',
          webhook_failure_count: (prev.webhook_failure_count || 0) + 1
        } : null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTestingWebhook(false);
    }
  };

  const getWebhookStatusBadge = () => {
    if (!settings?.webhook_url) return null;
    
    const status = settings.webhook_verification_status;
    
    if (status === 'verified') {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
          <Check className="h-3 w-3" /> Verified
        </span>
      );
    }
    
    if (status === 'failed') {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 flex items-center gap-1">
          <X className="h-3 w-3" /> Failed
        </span>
      );
    }
    
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">
        Not tested
      </span>
    );
  };

  if (loading) {
    return (
      <Card className='border-white/5 bg-[#0A0A0E]'>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-white/5 bg-[#0A0A0E]'>
      <CardHeader>
        <CardTitle className='text-base font-medium text-white'>
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Configure how you want to be notified about new leads and bookings. Changes are saved automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Section */}
        <div className='bg-[#050509] border border-white/5 rounded-lg p-4'>
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-500" />
                <h3 className="text-white font-medium text-sm">Email Notifications</h3>
              </div>
              <p className="text-xs text-zinc-500">
                Send email alerts to your inbox
              </p>
            </div>
            <Switch 
              checked={settings?.email_enabled || false}
              onCheckedChange={(v) => updateSetting('email_enabled', v)}
              disabled={loading}
              className='data-[state=checked]:bg-indigo-600 cursor-pointer'
            />
          </div>

          {settings?.email_enabled && (
            <div className="space-y-2 pt-3 border-t border-white/5">
              <Label className="text-zinc-400 text-xs">Custom Email Address</Label>
              <Input
                placeholder="notifications@yourcompany.com"
                value={settings.notification_email || ''}
                onChange={(e) => updateSetting('notification_email', e.target.value)}
                disabled={loading}
                type="email"
                className='bg-zinc-900 border-white/10 text-white placeholder:text-zinc-600 h-9'
              />
              <p className="text-xs text-zinc-600">
                Leave empty to use your account email
              </p>
            </div>
          )}
        </div>

        {/* SMS Section */}
        <div className='bg-[#050509] border border-white/5 rounded-lg p-4'>
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                <h3 className="text-white font-medium text-sm">SMS Notifications</h3>
              </div>
              <p className="text-xs text-zinc-500">
                Instant text messages via Twilio
              </p>
            </div>
            <Switch 
              checked={settings?.sms_enabled || false}
              onCheckedChange={(v) => updateSetting('sms_enabled', v)}
              disabled={loading}
              className='data-[state=checked]:bg-indigo-600'
            />
          </div>

          {settings?.sms_enabled && (
            <div className="space-y-2 pt-3 border-t border-white/5">
              <Label className="text-zinc-400 text-xs">Phone Number</Label>
              <Input
                placeholder="+1234567890"
                value={settings.notification_phone || ''}
                onChange={(e) => updateSetting('notification_phone', e.target.value)}
                disabled={loading}
                type="tel"
                className='bg-zinc-900 border-white/10 text-white placeholder:text-zinc-600 h-9'
              />
              <p className="text-xs text-zinc-600">
                International format required (e.g., +1234567890)
              </p>
            </div>
          )}
        </div>

        {/* Webhook Section */}
        <div className='bg-[#050509] border border-white/5 rounded-lg p-4'>
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4 text-indigo-500" />
                <h3 className="text-white font-medium text-sm">Webhook Integration</h3>
                {getWebhookStatusBadge()}
              </div>
              <p className="text-xs text-zinc-500">
                Send real-time data to external apps
              </p>
            </div>
            <Switch 
              checked={settings?.webhook_enabled || false}
              onCheckedChange={(v) => updateSetting('webhook_enabled', v)}
              disabled={loading}
              className='data-[state=checked]:bg-indigo-600'
            />
          </div>

          {settings?.webhook_enabled && (
            <div className="space-y-4 pt-3 border-t border-white/5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-400 text-xs">Webhook URL</Label>
                  {(settings?.webhook_failure_count ?? 0) > 0 && (
                    <span className="text-xs text-red-500">
                      {settings.webhook_failure_count} recent failures
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://hooks.slack.com/services/..."
                    value={settings.webhook_url || ''}
                    onChange={(e) => updateSetting('webhook_url', e.target.value)}
                    disabled={loading || validatingUrl}
                    className='flex-1 bg-zinc-900 border-white/10 text-white placeholder:text-zinc-600 h-9'
                    type="url"
                  />
                  <Button
                    onClick={testWebhook}
                    disabled={!settings.webhook_url || testingWebhook || loading}
                    className='bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-3'
                  >
                    {testingWebhook ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {validatingUrl && (
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Validating URL...
                  </p>
                )}
                
                {settings.webhook_url && (
                  <div className="text-xs space-y-2 mt-3">
                    <p className="text-zinc-500">
                      POST requests will be sent with this JSON structure:
                    </p>
                    <pre className="bg-zinc-900/50 border border-white/5 p-3 rounded text-xs overflow-x-auto text-zinc-400">
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
                <div className="text-xs text-emerald-500 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Last successful delivery: {new Date(settings.webhook_last_delivered_at).toLocaleString()}
                </div>
              )}

              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-300">Popular Webhook Services</p>
                    <ul className="text-xs text-zinc-500 space-y-1">
                      <li>
                        <span className="text-zinc-400">Slack:</span>{" "}
                        <code className="text-xs text-zinc-500">https://hooks.slack.com/services/...</code>
                      </li>
                      <li>
                        <span className="text-zinc-400">Discord:</span>{" "}
                        <code className="text-xs text-zinc-500">https://discord.com/api/webhooks/...</code>
                      </li>
                      <li>
                        <span className="text-zinc-400">Zapier:</span>{" "}
                        <code className="text-xs text-zinc-500">https://hooks.zapier.com/hooks/...</code>
                      </li>
                      <li>
                        <span className="text-zinc-400">Make:</span>{" "}
                        <code className="text-xs text-zinc-500">https://hook.make.com/...</code>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className='flex items-center gap-2 text-sm text-emerald-500'>
            <span className='w-2 h-2 bg-emerald-500 rounded-full'></span>
            Preferences saved successfully
          </div>
        )}
      </CardContent>
    </Card>
  );
}