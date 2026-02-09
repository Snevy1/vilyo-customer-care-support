/* // hooks/useWhatsAppPlans.ts
import useSWR from 'swr';

export interface WhatsAppPlan {
  id: string;
  plan_id: string;
  name: string;
  display_name: string;
  description: string;
  price: number; // In dollars, not cents
  currency: string;
  billing_interval: string;
  trial_period_days: number;
  features: string[];
  limits: Record<string, any>;
  is_active: boolean;
  is_default: boolean;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useWhatsAppPlans(options?: {
  activeOnly?: boolean;
  provider?: string;
}) {
  const queryParams = new URLSearchParams();
  
  if (options?.activeOnly !== false) {
    queryParams.set('activeOnly', 'true');
  }
  
  if (options?.provider) {
    queryParams.set('provider', options.provider);
  }

  const { data, error, isLoading } = useSWR(
    `/api/plans/whatsapp${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    fetcher
  );

  return {
    plans: data?.success ? data.data as WhatsAppPlan[] : [],
    isLoading,
    error: data?.success ? null : data?.error || error,
    meta: data?.meta
  };
}

 */