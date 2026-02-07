// app/checkout/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SelectedPlan {
  webchat?: string;
  whatsapp?: string;
  crm?: string;
  bundle?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPlans, setSelectedPlans] = useState<SelectedPlan>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get selections from query params or localStorage
    const paramsSelections = searchParams.get('selections');
    const storedSelections = localStorage.getItem('pricing_selections');
    
    if (paramsSelections) {
      setSelectedPlans(JSON.parse(paramsSelections));
    } else if (storedSelections) {
      setSelectedPlans(JSON.parse(storedSelections));
    }
    
    // Clear localStorage after reading
    localStorage.removeItem('pricing_selections');
    
    setLoading(false);
  }, [searchParams]);

  const handlePayment = async () => {
    try {
      // Call your payment API
      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedPlans })
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Selected Plans</h2>
        {/* Display selected plans here */}
      </div>
      
      <button
        onClick={handlePayment}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700"
      >
        Proceed to Payment
      </button>
    </div>
  );
}