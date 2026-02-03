// app/api/subscriptions/stats/route.ts - Get subscription statistics
import { NextRequest, NextResponse } from 'next/server';
import { PaymentProviderFactory } from '../factories/payment-provider.factory'; 
import { SubscriptionService } from '@/lib/subscriptions/services/subscription-service'; 
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get('user_session')?.value;
    
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { organization_id, role } = JSON.parse(userSession);
    
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    
    // Non-admin users can only see their own organization's stats
    if (role !== 'admin' && role !== 'super_admin') {
      if (organizationId && organizationId !== organization_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    
    const targetOrganizationId = organizationId || (role === 'admin' || role === 'super_admin' ? undefined : organization_id);
    
    const paymentProvider = PaymentProviderFactory.createProvider('paystack');
    const service = new SubscriptionService(paymentProvider);
    
    const stats = await service.getSubscriptionStats(targetOrganizationId);
    
    return NextResponse.json({
      success: true,
      stats,
      organizationId: targetOrganizationId,
    });
    
  } catch (error: any) {
    console.error('Error getting subscription stats:', error);
    return NextResponse.json(
      { error: `Failed to get subscription stats: ${error.message}` },
      { status: 500 }
    );
  }
}