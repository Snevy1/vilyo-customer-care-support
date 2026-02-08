import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { SubscriptionPlan, SubscriptionResponse } from "../subscription-checkout";
import { useCallback, useRef, useState, useEffect } from "react";
import { ApiClient } from "@/lib/apiClient/apiClient";
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
  const [setupData, setSetupData] = useState<{
    setupId: string;
    customerId: string;
    planId: string;
  } | null>(null);
  const processingRef = useRef(false);

  // Initialize PayPal setup on mount
  useEffect(() => {
    const initializeSetup = async () => {
      try {
        setIsProcessing(true);

        const response = await ApiClient.post<{
          requiresSetup: boolean;
          requiresRedirect?: boolean;
          redirectUrl?: string;
          setupId?: string;
          customerId?: string;
          productType: string;
          planTier: string;
          planId: string;
        }>('/api/subscriptions/setup', {
          productType,
          planTier: plan.name.toLowerCase(),
          paymentProvider: 'paypal',
        });

        if (!response.requiresSetup) {
          onError('Setup not required for this payment method');
          return;
        }

        // For PayPal, we get the setupId (which is the PayPal subscription ID)
        // But we don't redirect yet - we use PayPal buttons instead
        if (response.setupId && response.customerId && response.planId) {
          setSetupData({
            setupId: response.setupId,
            customerId: response.customerId,
            planId: response.planId,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to initialize PayPal';
        console.error('PayPal setup error:', error);
        onError(message);
        toast.error(message);
      } finally {
        setIsProcessing(false);
      }
    };

    if (isResolved) {
      initializeSetup();
    }
  }, [isResolved, productType, plan.name, onError]);

  const createSubscription = useCallback(async (data: any, actions: any) => {
    // Prevent duplicate submissions
    if (processingRef.current) {
      throw new Error('Subscription creation already in progress');
    }

    try {
      processingRef.current = true;
      setIsProcessing(true);

      // Use PayPal's SDK to create the subscription
      return actions.subscription.create({
        plan_id: plan.providerPlanId, // PayPal plan ID
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create subscription';
      onError(message);
      throw error;
    } finally {
      processingRef.current = false;
    }
  }, [plan.providerPlanId, onError]);

  const onApprove = useCallback(async (data: any, actions: any) => {
    if (processingRef.current) return;

    try {
      processingRef.current = true;
      setIsProcessing(true);

      if (!data.subscriptionID) {
        throw new Error('No subscription ID received from PayPal');
      }

      // Finalize subscription on backend
      const subscription = await ApiClient.post<SubscriptionResponse>(
        '/api/subscriptions/finalize',
        {
          setupId: data.subscriptionID,
          customerId: organizationId,
          productType,
          planTier: plan.name.toLowerCase(),
          planId: plan.providerPlanId,
          paymentProvider: 'paypal',
          tenantId,
        }
      );

      onSuccess(subscription);
      toast.success('Subscription activated successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to finalize subscription';
      console.error('PayPal finalize error:', error);
      onError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [organizationId, productType, plan, tenantId, onSuccess, onError]);

  const onPayPalError = useCallback((err: any) => {
    console.error('PayPal error:', err);
    const message = err?.message || 'An error occurred with PayPal. Please try again.';
    onError(message);
    toast.error(message);
  }, [onError]);

  const onCancel = useCallback(() => {
    toast.error('Payment canceled');
  }, []);

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
          {/* Info Banner */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start">
              <ShieldCheck className="mr-3 mt-0.5 h-5 w-5 text-blue-600" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">Secure Payment via PayPal</p>
                <p className="mt-1 text-blue-700">
                  Click the button below to continue with PayPal
                </p>
                {plan.trialDays && (
                  <p className="mt-2 font-medium text-blue-900">
                    ✨ {plan.trialDays}-day free trial - You won't be charged today
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* PayPal Buttons */}
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
            onCancel={onCancel}
            disabled={isProcessing}
          />

          {/* Terms */}
          <p className="text-center text-xs text-gray-500">
            By subscribing, you agree to automatic recurring payments.
            {plan.trialDays && ` You won't be charged for ${plan.trialDays} days.`}
          </p>
        </>
      )}
    </div>
  );
};