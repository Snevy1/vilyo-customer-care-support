"use client"

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../db/supabase/supabase';

interface Subscription {
  plan_id: string;
  status: string;
  current_period_end?: string;
}

interface Connection {
  is_crm_active: boolean;
  crm_type?: string;
}

interface TeamMember {
    id:string;
    name:string;
    user_email: string;
    image?:string;
    role?:string;
    status?: string;
}

const CrmPage = () => {
  const [crmConnected, setCrmConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [userData, setUserData] = useState<{email: string,  role:string | undefined, userId: string | null | undefined} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [organizationData, setOrganizationData] = useState({business_name: null,created_at: null,external_links:"",id: "",user_email: "",website_url: ""
  });
  
 


  useEffect(()=>{
          fetchTeam();
      },[])
  
  
  
  
      const fetchTeam = async ()=>{
          try {
              const res = await fetch("/api/team/fetch");
  
              if(res.ok){
                  const data = await res.json();
  
                  setTeam(data.team)
              }
              
          } catch (error) {
  
              console.log(error, "Team member fetching error")
          }
      }

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Get user data from Supabase
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserData({
            email: user.email!,
            userId: user.id,
            role: user.role,
          });
        }

        // Fetch organization data including subscription and connection
        const response = await fetch("/api/organization/fetch");
        
        if (!response.ok) {
          throw new Error('Failed to fetch organization data');
        }
        
        const data = await response.json();
        const organization = data.organization;
        const subscription = data.subscription;
        const connection = data.connection;

        console.log("organization",organization)

        if (organization) {
          const orgId = organization.id;
          setOrganizationId(orgId);
          setOrganizationData(organization);
          setSubscription(subscription);
          setConnection(connection);
          setUserData({
            email: organization.user_email!,
            userId: organization?.id,
            role: undefined
          });

          
          
          if (connection?.is_crm_active) {
            setCrmConnected(true);
          }
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      } finally {
        setLoading(false);
      }
    };
    checkConnection();
  }, []);


  
          

     

  const handleConnect = async () => {
    console.log(organizationId,subscription,userData)

    if(team.length > 0){

      
            
            const matchingMember = team.find(
  (member) => member.user_email === organizationData.user_email
);

if (matchingMember) {
  setUserData({
    email: organizationData.user_email,
    userId: matchingMember.id,
    role: matchingMember.role
  });
}
  if(matchingMember){
              
          setUserData({
            email: organizationData.user_email,
            userId: matchingMember?.id,
            role: matchingMember?.role
          });

            }
          }
    if (!organizationId || !subscription || !userData) {
      setError("Missing required data. Please try refreshing the page again!.");
      return;
    }

    if(userData.role === "member" ){
      setError("You don't have permission to connect the CRM.");
      return;

    }
    
    setLoading(true);
    setError(null);
    
    try {
      
      localStorage.setItem('crm_context', JSON.stringify({
        organizationId: organizationId,
        userId: userData.userId
    }));

      const response = await fetch('/api/crm/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          organizationId,
          subscription,
          connection,
          userEmail: userData?.email,
          userId: userData?.userId
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || data.details || 'Failed to connect');
        return;
      }
      
      if (data.url) {
        window.location.href = data.url;
      }
      
      // If this was the first connection, update local state
      if (data.connection_updated) {
        setCrmConnected(true);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error("Failed to generate login link", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCRM = async () => {


    if(team.length > 0){

      
            
            const matchingMember = team.find(
  (member) => member.user_email === organizationData.user_email
);

if (matchingMember) {
  setUserData({
    email: organizationData.user_email,
    userId: matchingMember.id,
    role: matchingMember.role
  });
}
            console.log("matchingMember",matchingMember)
            if(matchingMember){
              
          setUserData({
            email: organizationData.user_email,
            userId: matchingMember?.id,
            role: matchingMember?.role
          });

            }
          }

          console.log(organizationId,subscription,userData)
    if (!organizationId || !subscription || !userData) {
      setError("Missing required data. Please try refreshing the page.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/crm/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          organizationId,
          subscription,
          connection,
          userEmail: userData.email,
          userId: userData.userId
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || data.details || 'Failed to access CRM');
        return;
      }
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error("Failed to generate login link", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  const subscriptionStatus = subscription?.status || 'inactive';

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
          {error.includes('subscription') && (
            <a href="/dashboard/finance" className="ml-2 underline">Go to Billing</a>
          )}
        </div>
      )}
      
      {crmConnected ? (
        <div>
          <h1 className="text-xl font-bold">CRM is Connected</h1>
          <p className="text-gray-600 mt-2">
            Your organization's CRM is connected and available to all team members.
          </p>
          <div className="mt-6 space-y-3">
            <button 
              onClick={handleAccessCRM}
              className="w-full md:w-auto bg-blue-500 text-white p-3 rounded hover:bg-blue-600"
            >
              Open CRM Dashboard
            </button>
            <p className="text-sm text-gray-500">
              This will generate a magic link sent to your email
            </p>
          </div>
          
          {/* Subscription status info */}
          {subscription && (
            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h3 className="font-medium">
                Plan: <span className="capitalize">{subscription.plan_id}</span>
                <span className={`ml-2 ${subscriptionStatus === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
                  ({subscriptionStatus.toUpperCase()})
                </span>
              </h3>
              {subscriptionStatus !== 'active' && (
                <a href="/dashboard/finance" className="text-blue-600 text-sm underline mt-2 inline-block">
                  Update subscription
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <h1 className="text-xl font-bold mb-4">Connect Your CRM</h1>
          <p className="mb-4 text-gray-600">
            Link your CRM to manage contacts, deals, and automate workflows.
          </p>
          <p className="mb-4 text-gray-600 text-sm">
            Once connected, all team members in your organization will have access.
          </p>
          
          {/* Subscription check */}
          {subscriptionStatus !== 'active' && (
            <div className="mb-6 p-4 bg-amber-50 text-amber-800 rounded">
              <p className="font-medium">Active subscription required</p>
              <a href="/dashboard/finance" className="text-sm underline mt-1 inline-block">
                Subscribe now to enable CRM features
              </a>
            </div>
          )}
          
          <button 
            onClick={handleConnect}
            className="bg-green-600 text-white p-3 rounded hover:bg-green-700 disabled:bg-gray-400"
            disabled={!organizationId || subscriptionStatus !== 'active'}
          >
            {!organizationId ? "Join an organization first" : 
             subscriptionStatus !== 'active' ? "Active subscription required" : 
             "Connect Atomic CRM"}
          </button>
        </div>
      )}
    </div>
  );
};

export default CrmPage;