import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { SubscriptionPlan, SubscriptionResponse } from "../subscription-checkout";
import { useCallback, useRef, useState } from "react";
import { subscriptionApi } from "@/lib/apiClient/apiClient";
import toast from "react-hot-toast";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PayPalButtonWrapperProps {
  plan: SubscriptionPlan;
  organizationId: string;
  productType: string;
  tenantId?: string;
  onSuccess: (subscription: SubscriptionResponse) => void;
  onError: (error: string) => void;
}

export const PayPalButtonWrapper: React.FC<PayPalButtonWrapperProps> = ({
  plan,
  organizationId,
  productType,
  tenantId,
  onSuccess,
  onError,
}) => {
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  const createSubscription = useCallback(async () => {
    // Prevent duplicate submissions
    if (processingRef.current) {
      throw new Error('Subscription creation already in progress');
    }

    try {
      processingRef.current = true;
      setIsProcessing(true);

      // Create subscription on backend
         const response = await subscriptionApi.createCheckoutSession({
          organizationId,
          productType,
          planTier: plan.name.toLowerCase(),
          paymentProvider: 'paypal',
          planId: plan.providerPlanId,
          tenantId,
          metadata: {
            planName: plan.name,
            planPrice: plan.price,
            planInterval: plan.interval,
          },
        })
      

      if (!response.subscriptionId) {
        throw new Error('Invalid response from server');
      }

      return response.subscriptionId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create subscription';
      onError(message);
      throw error;
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [plan, organizationId, productType, tenantId, onError]);

  const onApprove = useCallback(async (data: any) => {
    if (processingRef.current) return;

    try {
      processingRef.current = true;
      setIsProcessing(true);

      if (!data.subscriptionID) {
        throw new Error('No subscription ID received from PayPal');
      }

      // Verify subscription on backend
      const response = await subscriptionApi.verifySubscription({
          subscriptionId: data.subscriptionID,
         paymentProvider: 'paypal',
          organizationId,
          planId: plan.id,
        });

      onSuccess(response);
      toast.success('Subscription activated successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify subscription';
      onError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [organizationId, plan.id, onSuccess, onError]);

  const onPayPalError = useCallback((err: any) => {
    console.error('PayPal error:', err);
    const message = err?.message || 'An error occurred with PayPal. Please try again.';
    onError(message);
    toast.error(message);
  }, [onError]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
        <span>Loading PayPal...</span>
      </div>
    );
  }

  if (isRejected) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load PayPal. Please refresh the page or try a different payment method.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="relative space-y-4">
      {isProcessing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Processing your subscription...</p>
          </div>
        </div>
      )}

      {isResolved && (
        <>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start">
              <ShieldCheck className="mr-3 mt-0.5 h-5 w-5 text-blue-600" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">Secure Payment via PayPal</p>
                <p className="mt-1 text-blue-700">
                  You'll be redirected to PayPal to complete your subscription
                </p>
              </div>
            </div>
          </div>

          <PayPalButtons
            style={{
              layout: 'vertical',
              shape: 'rect',
              color: 'blue',
              label: 'subscribe',
              height: 48,
            }}
            createSubscription={createSubscription}
            onApprove={onApprove}
            onError={onPayPalError}
            disabled={isProcessing}
          />
        </>
      )}
    </div>
  );
};