"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../db/supabase/supabase';
import WhatsAppPlanSelection from '@/components/dashboard/whatsapp/WhatsAppPlanSelection';

interface Subscription {
  plan_id: string;
  status: string;
}

interface Connection {
  isWhatsappConnected: boolean; // Updated to match schema
  kapsoCustomerId?: string;
}

interface TeamMember {
  id: string;
  name: string;
  user_email: string;
  role?: 'owner' | 'admin' | 'member'; // Standardize roles
}

const WhatsAppPage = () => {
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [userData, setUserData] = useState<{ 
    email: string; 
    role: 'owner' | 'admin' | 'member' | null; 
    userId: string | null 
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<Connection | null>(null);

  useEffect(() => {
    fetchTeam();
    checkConnection();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/team/fetch");
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
      }
    } catch (error) {
      console.error("Team fetching error:", error);
    }
  };

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch organization data
      const response = await fetch("/api/organization/fetch");
      if (!response.ok) throw new Error('Failed to fetch organization data');

      const data = await response.json();
      const organization = data.organization;

      if (organization) {
        setOrganizationId(organization.id);
        setOrganizationName(organization.business_name || organization.name);
        setOrganizationData(organization);
       
        // Also fetch WhatsApp connection status
        const whatsappRes = await fetch(`/api/whatsapp/status?organization_id=${organization.id}`);
        if (whatsappRes.ok) {
          const whatsappData = await whatsappRes.json();
          setConnectionStatus(whatsappData);
          setWhatsappConnected(whatsappData.isWhatsappConnected || false);
          setSubscription(whatsappData.whatsAppSubscription);
        }

        // Determine user role from team data
        const userEmail =  organization.user_email;
        const matchingMember = team.find(member => 
          member.user_email === userEmail
        );

        
        
        const userRole: 'owner' | 'admin' | 'member' =
            matchingMember?.role ?? 'admin';

setUserData({
  email: userEmail,
  userId: user?.id || organization.id,
  role: userRole,
});

      }
    } catch (err) {
      console.error('Error checking connection:', err);
      setError('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWhatsApp = async () => {
    // 1. Permission check - only owners/admins can connect
    if (userData?.role !== 'owner' && userData?.role !== 'admin') {
      setError("Only organization owners or administrators can connect WhatsApp.");
      return;
    }

    // 2. Validate required data
    if (!organizationId || !organizationName || !userData?.email) {
      setError("Missing required data. Please refresh the page.");
      return;
    }

    // 3. Subscription check
    if (subscription?.status !== 'active') {
      setError("An active subscription is required to enable WhatsApp capabilities.");
      return;
    }

    // 4. Already connected check
    if (whatsappConnected) {
      setError("WhatsApp is already connected for this organization.");
      return;
    }

    setShowPlanSelection(true);

    
  };

  

  const handleOpenWhatsApp = () => {
    // When WhatsApp is connected, any member can open it
    if (whatsappConnected) {
      window.open('http://localhost:3000/whatsappInbox', '_blank');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-600">Initializing WhatsApp Engine...</p>
      </div>
    );
  }

  const canConnectWhatsApp = userData?.role === 'owner' || userData?.role === 'admin';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

    {
        showPlanSelection ? (
      <WhatsAppPlanSelection
        organizationId={organizationId!}
        organizationName={organizationName!}
        userEmail={userData?.email!}
        onBack={() => setShowPlanSelection(false)}
      />):(
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.395 0 .01 5.388 0 12.044c0 2.116.539 4.186 1.59 6.001L0 24l6.135-1.61a11.822 11.822 0 005.915 1.564h.005c6.654 0 12.039-5.39 12.042-12.045a11.808 11.808 0 00-3.468-8.514z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WhatsApp AI Support</h1>
              <p className="text-gray-500">Connect your Business account to automate customer queries.</p>
            </div>
          </div>

          {/* Role-based access message */}
          {!canConnectWhatsApp && !whatsappConnected && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 rounded">
              <p className="font-bold">Access Restricted</p>
              <p>Only organization administrators can connect WhatsApp. Your current role: <strong>{userData?.role}</strong></p>
            </div>
          )}

          {whatsappConnected ? (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-800 font-medium">WhatsApp Connected ✓</span>
                {userData?.role && (
                  <span className="ml-auto px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    Access as: {userData.role}
                  </span>
                )}
              </div>
              
              <p className="text-gray-600">
                Your WhatsApp Business account is linked. Messages sent to your number will now be processed by your AI agents.
                {userData?.role === 'member' && " As a member, you can use WhatsApp but not modify the connection."}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handleOpenWhatsApp}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.395 0 .01 5.388 0 12.044c0 2.116.539 4.186 1.59 6.001L0 24l6.135-1.61a11.822 11.822 0 005.915 1.564h.005c6.654 0 12.039-5.39 12.042-12.045a11.808 11.808 0 00-3.468-8.514z" />
                  </svg>
                  Open WhatsApp Web
                </button>
                {canConnectWhatsApp && (
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                    Configure AI Settings
                  </button>
                )}
                {canConnectWhatsApp && (
                  <button className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition">
                    View Analytics
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6 py-4">
                <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                  <h3 className="font-semibold mb-2">1. Connect Account</h3>
                  <p className="text-sm text-gray-500">Log in via Meta to grant permissions for messaging.</p>
                </div>
                <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                  <h3 className="font-semibold mb-2">2. Deploy AI</h3>
                  <p className="text-sm text-gray-500">Your chatbot builder logic will automatically apply to WhatsApp.</p>
                </div>
              </div>

              {subscription?.status !== 'active' ? (
                <div className="p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                  <p className="font-medium">Subscription Required</p>
                  <p className="text-sm">Please upgrade your plan to enable the WhatsApp channel.</p>
                   <button className="text-sm underline mt-2 block font-bold cursor-pointer" onClick={()=>setShowPlanSelection(true)}>
                      Upgrade Now
                   </button>
                  
                </div>
              ) : !canConnectWhatsApp ? (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                  <p className="font-medium">Admin Permission Required</p>
                  <p className="text-sm">Only organization administrators can connect WhatsApp. Contact your admin to get started.</p>
                </div>
              ) : (
                <button 
                  onClick={handleConnectWhatsApp}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg shadow-green-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Initializing...
                    </span>
                  ) : 'Connect WhatsApp Account'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      )
    }
    

      
    </div>
  );
};

export default WhatsAppPage;