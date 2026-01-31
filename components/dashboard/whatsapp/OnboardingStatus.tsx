"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function OnboardingStatus({ organizationId }: { organizationId: string }) {
  const [status, setStatus] = useState<'loading' | 'completed' | 'error'>('loading');
  const router = useRouter();

  useEffect(() => {
    // Poll your own DB API every 3 seconds to see if the webhook updated the record
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/whatsapp/status?orgId=${organizationId}`);
        const data = await res.json();

        if (data.isWhatsappConnected && data.whatsappPhoneNumberId) {
          setStatus('completed');
          // Short delay for the "Success" animation before redirecting
          setTimeout(() => router.push('/dashboard/whatsapp/inbox'), 2000);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    };

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [organizationId, router]);

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-xl border">
      {status === 'loading' && (
        <>
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-bold">Connecting WhatsApp...</h2>
          <p className="text-gray-500 mt-2">We're verifying your credentials with Meta. Please don't close this page.</p>
        </>
      )}
      
      {status === 'completed' && (
        <>
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-green-700">Account Linked!</h2>
          <p className="text-gray-500 mt-2">Taking you to your new WhatsApp Inbox...</p>
        </>
      )}
    </div>
  );
}