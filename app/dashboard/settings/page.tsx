


'use client'

import TeamSection from '@/components/dashboard/settings/teamSection';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Trash2, Save, Loader2, AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { NotificationPreferences } from '@/components/notification';
import { GoogleCalendarConnect } from '@/components/GoogleCalendarConnect';

interface OrganizationData {
  id: string;
  business_name: string;
  website_url: string;
  created_at: string;
}

interface ScoringRule {
  id?: number;
  rule_name: string;
  rule_type: string;
  trigger_condition: any;
  score_change: number;
  is_active: boolean;
}

const SettingsPage = () => {
  const [organizationData, setOrganizationData] = useState<OrganizationData>();
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([]);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchOrganizationData = async () => {
      const response = await fetch("/api/organization/fetch");
      const data = await response.json();
      setOrganizationData(data.organization);
    };

    fetchOrganizationData();
  }, []);

  

useEffect(() => {
    const fetchScoringRules = async () => {
      if (!organizationData?.id) return;
      
      setIsLoadingRules(true);
      
      try {
        const res = await fetch(`/api/lead-scoring-rules/${organizationData.id}`);
        const data = await res.json();
        
        setScoringRules(data.rules || []);
        
        // Show success message if rules were just seeded
        if (data.seeded) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 5000);
        }
        
      } catch (error) {
        console.error('Failed to fetch scoring rules:', error);
      } finally {
        setIsLoadingRules(false);
      }
    };

    if (organizationData?.id) {
      fetchScoringRules();
    }
  }, [organizationData?.id]);

  const handleSaveRules = async () => {
    if (!organizationData?.id) return;

    setIsSavingRules(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/lead-scoring-rules/${organizationData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: scoringRules })
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save scoring rules');
      }
    } catch (error) {
      console.error('Failed to save rules:', error);
      alert('Failed to save scoring rules');
    } finally {
      setIsSavingRules(false);
    }
  };

  const toggleRule = (index: number) => {
    const updated = [...scoringRules];
    updated[index].is_active = !updated[index].is_active;
    setScoringRules(updated);
  };

  const updateScore = (index: number, newScore: number) => {
    const updated = [...scoringRules];
    updated[index].score_change = newScore;
    setScoringRules(updated);
  };

  const getConditionSummary = (condition: any): string => {
    if (!condition) return 'No condition set';

    switch (condition.type) {
      case 'not_in_list':
        return `Email NOT from: ${condition.values?.join(', ')}`;
      case 'in_list':
        return `Email from: ${condition.values?.join(', ')}`;
      case 'exists':
        return `${condition.field} is provided`;
      case 'greater_than':
        return `${condition.field} length > ${condition.value} characters`;
      case 'less_than':
        return `Response time < ${condition.value} seconds`;
      case 'greater_than_or_equal':
        return `${condition.field} >= ${condition.value}`;
      case 'contains_any':
        return `Contains: ${condition.values?.join(', ')}`;
      default:
        return JSON.stringify(condition);
    }
  };

  return (
    <div className='p-6 md:p-8 space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500'>
      <div>
        <h1 className='text-2xl font-semibold text-white tracking-tight'>
          Settings
        </h1>
        <p className='text-sm text-zinc-400 mt-1'>
          Manage workspace preferences, security, and billing.
        </p>
      </div>

      {/* Workspace Settings Card */}
      <Card className='border-white/5 bg-[#0A0A0E]'>
        <CardHeader>
          <CardTitle className='text-base font-medium text-white'>
            Workspace Settings
          </CardTitle>
          <CardDescription>
            General settings for your organization. (Read Only)
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-6'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label className="text-zinc-500">Workspace Name</Label>
              <div className='p-3 rounded-md bg-white/5 border border-white/5 text-white'>
                {organizationData?.business_name || "Vilyo Inc."}
              </div>
            </div>

            <div className='space-y-2'>
              <Label className='text-zinc-500'>Primary Website</Label>
              <div className='p-3 rounded-md bg-white/5 border border-white/5 text-white'>
                {organizationData?.website_url}
              </div>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2 text-white'>
              <Label className='text-zinc-500'>Default Language</Label>
              <div className='p-3 rounded-md bg-white/5 border border-white/5 text-white'>
                English
              </div>
            </div>

            <div className='space-y-2 text-white'>
              <Label className='text-zinc-500'>Timezone</Label>
              <div className='p-3 rounded-md bg-white/5 border border-white/5 text-white'>
                UTC (GMT+0)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences - NEW */}
      {organizationData?.id && (
        <NotificationPreferences orgId={organizationData.id} />
      )}

       {/* Notification Preferences - NEW */}
      {organizationData?.id && (
        <GoogleCalendarConnect orgId={organizationData.id} />
      )}

      

      {/* Lead Scoring Rules Card */}
      <Card className='border-white/5 bg-[#0A0A0E]'>
        <CardHeader>
          <CardTitle className='text-base font-medium text-white'>
            Lead Scoring Rules
          </CardTitle>
          <CardDescription>
            Customize how leads are automatically scored and qualified. Higher scores indicate higher-quality leads.
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-6'>
          {isLoadingRules ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='w-6 h-6 animate-spin text-indigo-500' />
            </div>
          ) : scoringRules.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <AlertCircle className='w-8 h-8 text-zinc-600 mb-2' />
              <p className='text-zinc-400 text-sm'>No scoring rules found</p>
              <p className='text-zinc-600 text-xs mt-1'>Default rules will be created automatically</p>
            </div>
          ) : (
            <>
              <div className='space-y-3'>
                {scoringRules.map((rule, index) => (
                  <div
                    key={rule.id || index}
                    className='bg-[#050509] border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors'
                  >
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h3 className='text-white font-medium text-sm'>{rule.rule_name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            rule.is_active 
                              ? 'bg-emerald-500/10 text-emerald-500' 
                              : 'bg-zinc-700/50 text-zinc-500'
                          }`}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className='text-xs text-zinc-500 wrap-break-word'>
                          {getConditionSummary(rule.trigger_condition)}
                        </p>
                      </div>

                      <div className='flex items-center gap-3 shrink-0'>
                        <div className='flex items-center gap-2'>
                          <Label className='text-xs text-zinc-400 whitespace-nowrap'>Points:</Label>
                          <Input
                            type="number"
                            value={rule.score_change}
                            onChange={(e) => updateScore(index, parseInt(e.target.value) || 0)}
                            className='w-16 h-8 bg-zinc-900 border-white/10 text-white text-sm text-center'
                            min={0}
                            max={100}
                          />
                        </div>

                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => toggleRule(index)}
                          className='data-[state=checked]:bg-indigo-600'
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Score Thresholds Info */}
              <div className='bg-zinc-900/50 border border-white/5 rounded-lg p-4 mt-6'>
                <h3 className='text-white font-medium text-sm mb-3'>Score Thresholds</h3>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  <div className='text-center p-2 bg-red-500/5 border border-red-500/20 rounded'>
                    <div className='text-lg mb-1'>🔥</div>
                    <div className='text-xs text-zinc-400'>Hot Lead</div>
                    <div className='text-sm font-medium text-white mt-1'>70+ pts</div>
                  </div>
                  <div className='text-center p-2 bg-yellow-500/5 border border-yellow-500/20 rounded'>
                    <div className='text-lg mb-1'>💼</div>
                    <div className='text-xs text-zinc-400'>Warm Lead</div>
                    <div className='text-sm font-medium text-white mt-1'>40-69 pts</div>
                  </div>
                  <div className='text-center p-2 bg-blue-500/5 border border-blue-500/20 rounded'>
                    <div className='text-lg mb-1'>❄️</div>
                    <div className='text-xs text-zinc-400'>Cold Lead</div>
                    <div className='text-sm font-medium text-white mt-1'>20-39 pts</div>
                  </div>
                  <div className='text-center p-2 bg-zinc-500/5 border border-zinc-500/20 rounded'>
                    <div className='text-lg mb-1'>❌</div>
                    <div className='text-xs text-zinc-400'>Unqualified</div>
                    <div className='text-sm font-medium text-white mt-1'>0-19 pts</div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className='flex items-center gap-3 pt-2'>
                <Button
                  onClick={handleSaveRules}
                  disabled={isSavingRules}
                  className='bg-indigo-600 hover:bg-indigo-700 text-white'
                >
                  {isSavingRules ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='w-4 h-4 mr-2' />
                      Save Scoring Rules
                    </>
                  )}
                </Button>

                {saveSuccess && (
                  <span className='text-sm text-emerald-500 flex items-center gap-1'>
                    <span className='w-2 h-2 bg-emerald-500 rounded-full'></span>
                    Changes saved successfully
                  </span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Team Section */}
      <TeamSection />

      {/* Danger Zone Card */}
      <Card className='border-red-500/10 bg-red-500/2'>
        <CardHeader>
          <CardTitle className='text-base font-medium text-red-500'>
            Danger Zone
          </CardTitle>
          <CardDescription className='text-red-500/60'>
            Irreversible actions for this workspace.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <p className='text-sm font-medium text-zinc-300'>
                Delete Workspace
              </p>
              <p className='text-xs text-zinc-500'>
                Permanently delete all knowledge, conversations, and settings.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className='bg-red-500/10 text-red-500 hover:bg-red-500'
                >
                  <Trash2 className='w-4 h-4 mr-2' />
                  Delete
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent className='bg-[#0E0E12] border-white/10'>
                <AlertDialogHeader>
                  <AlertDialogTitle className='text-white'>
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription className='text-zinc-400'>
                    This action cannot be undone. This will permanently delete your workspace and remove all 
                    associated data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel className='bg-transparent border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white'>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction className='bg-red-500 text-white hover:bg-red-600 border-none'>
                    Delete Workspace
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;





















 /*  ====BEFORE LEAD CUSTOMIZATION ======= */


/* 'use client'


import TeamSection from '@/components/dashboard/settings/teamSection';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';


interface OrganizationData {
  id:string;
  business_name:string;
  website_url:string;
  created_at:string;
}

const SettingsPage = () => {

const [organizationData, setOrganizationData] = useState<OrganizationData>();


useEffect(()=>{
  const fetchOrganizationData = async ()=>{
    const response = await fetch("/api/organization/fetch");
    const data = await response.json();
    setOrganizationData(data.organization)
  };

  fetchOrganizationData()
},[])



  return (
    <div className='p-6 md:p-8 space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500'>

      <div>
        <h1 className='text-2xl font-semibold text-white tracking-tight'>
          Settings
          </h1>
          <p className='text-sm text-zinc-400 mt-1'>
            Manage workspace preferences, security, and billing.
          </p>
      </div>

     <Card className='border-white/5 bg-[#0A0A0E]'>
       <CardHeader >
        <CardTitle className='text-base font-medium text-white'>
          Workspace Settings
        </CardTitle>
        <CardDescription>
          General settings for your organization.(Read Only)
        </CardDescription>

       </CardHeader>

       <CardContent className='space-y-6'>
        <div className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label className="text-zinc-500">Workspace Name</Label>
            <div className='p-3 rounded-md bg-white/5 border border-white/5 text-white'>
              {organizationData?.business_name || "Vilyo Inc."}
            </div>

          </div>

           <div className='space-y-2'>
            <Label className='text-zinc-500'>Primary Website</Label>

            <div className='p-3 rounded-md bg-white/5 border border-white/5 text-white'>
             {organizationData?.website_url}

            </div>

           </div>

        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-2 text-white'>
            <Label className='text-zinc-500'>Default Language</Label>
            <div className='p-3 rounded-md bg-white/5 border border-white/5 text-white'>
             English
            </div>

          </div>

          <div className='space-y-2 text-white'>
            <Label className='text-zinc-500'>
              Timezone
            </Label>
            <div className='p-3 rounded-md bg-white/5 border border-white/5 text-white'>
              UTC (GMT+0)
            </div>

          </div>

        </div>

       </CardContent>

     </Card>
     <TeamSection />

     <Card className='border-red-500/10 bg-red-500/2'>

        <CardHeader>
          <CardTitle className='text-base font-medium text-red-500'>
            Danger Zone
          </CardTitle>
          <CardDescription className='text-red-500/60'>
          Irreversible actions for this workspace.

          </CardDescription>

        </CardHeader>

        <CardContent>
          <div className='flex items-center justify-between'>

            <div className='space-y-0.5'>
              <p className='text-sm font-medium text-zinc-300'>
                Delete Workspace
              </p>
              <p className='text-xs text-zinc-500'>
                Permanently delete all knowledge, conversations, and settings.
              </p>

            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                variant="destructive"
                className='bg-red-500/10 text-red-500 hover:bg-red-500'
                
                >
                  <Trash2  className='w-4 h-4 mr-2' />
                  Delete

                </Button>

              </AlertDialogTrigger>

              <AlertDialogContent className='bg-[#0E0E12] border-white/10'>
              <AlertDialogHeader>
                <AlertDialogTitle className='text-white'>
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription className='text-zinc-400'>
                  This action cannot be undone. This will permanently delete your workspace and remove all 
                  associated data from our servers.

                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel className='bg-transparent border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white'>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction className='bg-red-500 text-white hover:bg-red-600 border-none'>
                  Delete Workspace
                </AlertDialogAction>
              </AlertDialogFooter>

              </AlertDialogContent>

            </AlertDialog>

          </div>

        </CardContent>

     </Card>
    </div>
  )
}

export default SettingsPage */