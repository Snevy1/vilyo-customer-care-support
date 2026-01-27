"use client"

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../db/supabase/supabase';

const CrmPage = () => {
  const [crmConnected, setCrmConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      // 1. Get the current user
      const { data: { user } } = await supabase.auth.getUser();

      console.log("user", user);

      if (user) {
        // 2. Check a 'connections' table to see if CRM is linked
        const { data, error } = await supabase
          .from('user_connections') 
          .select('is_crm_active')
          .eq('user_id', user.id)
          .single();

        if (data?.is_crm_active) setCrmConnected(true);
      }
      setLoading(false);
    };
    checkConnection();
  }, []);

  const handleConnect = async () => {
  try {
    const response = await fetch('/api/crm/auth');
    const data = await response.json();
    
    if (data.url) {
      // This will take them to Supabase, then automatically 
      // redirect them to the CRM, logged in!
      window.location.href = data.url;
    }
  } catch (err) {
    console.error("Failed to generate login link", err);
  }
};

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      {crmConnected ? (
        <div>
          <h1 className="text-xl font-bold">CRM is Connected</h1>
          <button 
             onClick={() => window.location.href = "http://localhost:5173"}
             className="bg-blue-500 text-white p-2 rounded mt-4"
          >
            Open CRM Dashboard
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-4">You haven't linked your CRM yet.</p>
          <button 
            onClick={handleConnect}
            className="bg-green-600 text-white p-2 rounded"
          >
            Connect Atomic CRM
          </button>
        </div>
      )}
    </div>
  );
};

export default CrmPage;