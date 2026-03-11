// ============================================================================
// PROVIDER SELECTION
// ============================================================================


import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PaymentProcessor } from './subscription-checkout';

interface ProviderSelectionProps {
  availableProcessors: PaymentProcessor[];
  onSelectProvider: (provider: PaymentProcessor) => void;
  selectedProvider: PaymentProcessor | null;
}

export const ProviderSelection: React.FC<ProviderSelectionProps> = ({
  availableProcessors,
  onSelectProvider,
  selectedProvider,
}) => {
  if (availableProcessors.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No payment methods are currently available. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <CreditCard className="h-4 w-4" />
        <span>Select your preferred payment method</span>
      </div>

      {/* Processors Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {availableProcessors.map((processor) => (
          <Card
            key={processor.id}
            className={`group cursor-pointer transition-all hover:border-primary hover:shadow-md ${
              selectedProvider?.id === processor.id
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => onSelectProvider(processor)}
          >
            <CardContent className="flex flex-col items-center p-6">
              {/* Logo */}
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-white p-2 shadow-sm">
                <img
                  src={processor?.logo_url || ''}
                  alt={processor.display_name}
                  className="h-full w-full object-contain text-zinc-700"
                  onError={(e) => {
                    // Fallback for broken images
                    e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23e5e7eb' rx='8'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='10' font-weight='600' fill='%236b7280'%3E${processor.displayName}%3C/text%3E%3C/svg%3E`;
                  }}
                />
              </div>

              {/* Name */}
              <h3 className="mb-2 text-center font-semibold text-gray-900">
                {processor?.display_name}
              </h3>

              {/* Currencies */}
              <Badge variant="outline" className="mb-3 text-xs">
                {processor.supportedCurrencies.slice(0, 3).join(', ')}
                {processor.supportedCurrencies.length > 3 && ' +more'}
              </Badge>

              {/* Selected Indicator */}
              {selectedProvider?.id === processor.id && (
                <div className="flex items-center gap-1 text-sm font-medium text-primary">
                  <CheckCircle className="h-4 w-4" />
                  <span>Selected</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Helper Text */}
      {selectedProvider && (
        <p className="text-center text-sm text-gray-600">
          Continue with <strong>{selectedProvider?.display_name}</strong> to complete your subscription
        </p>
      )}
    </div>
  );
};