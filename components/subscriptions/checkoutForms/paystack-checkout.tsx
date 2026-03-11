import { useCallback, useRef, useState } from "react";
import { SubscriptionPlan, SubscriptionResponse } from "../subscription-checkout";
import toast from "react-hot-toast";
import { subscriptionApi } from "@/lib/apiClient/apiClient";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaystackCheckoutFormProps {
  plan: SubscriptionPlan;
  organizationId: string;
  productType: string;
  tenantId?: string;
  onSuccess: (subscription: SubscriptionResponse) => void;
  onError: (error: string) => void;
}

export const PaystackCheckoutForm: React.FC<PaystackCheckoutFormProps> = ({
  plan,
  organizationId,
  productType,
  tenantId,
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const processingRef = useRef(false);

  const handleSubmit = useCallback(async () => {
    if (processingRef.current) {
      toast.error('Checkout already in progress');
      return;
    }

    try {
      processingRef.current = true;
      setIsLoading(true);

      const response = await  subscriptionApi.createCheckoutSession(
        {
          organizationId,
          productType,
          planTier: plan.name.toLowerCase(),
          paymentProvider: 'paystack',
          planId: plan.providerPlanId,
          tenantId,
          callbackUrl: `${window.location.origin}/dashboard/finance/subscriptions?provider=paystack`,
        }
      )
      

      if (!response.authorization_url) {
        throw new Error('Invalid checkout URL received');
      }

      // Redirect to Paystack checkout
      window.location.href = response.authorization_url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initiate Paystack checkout';
      console.error('Paystack checkout error:', error);
      onError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
      processingRef.current = false;
    }
  }, [plan, organizationId, productType, tenantId, onError]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
        <div className="flex items-start">
          <ShieldCheck className="mr-3 mt-0.5 h-5 w-5 text-purple-600" />
          <div className="text-sm text-purple-900">
            <p className="font-medium">Secure Payment via Paystack</p>
            <p className="mt-1 text-purple-700">
              Accept payments from all major cards and mobile money
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting to Paystack...
          </>
        ) : (
          `Pay ${plan.currency} ${plan.price}/${plan.interval} with Paystack`
        )}
      </Button>
    </div>
  );
};