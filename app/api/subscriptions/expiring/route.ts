// app/api/subscriptions/expiring/route.ts - Get expiring subscriptions
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
    const days = url.searchParams.get('days') ? parseInt(url.searchParams.get('days')!) : 7;
    const organizationId = url.searchParams.get('organizationId');
    
    // Non-admin users can only see their own organization's expiring subscriptions
    if (role !== 'admin' && role !== 'super_admin') {
      if (organizationId && organizationId !== organization_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    
    const targetOrganizationId = organizationId || (role === 'admin' || role === 'super_admin' ? undefined : organization_id);
    
    const paymentProvider = PaymentProviderFactory.createProvider('paystack');
    const service = new SubscriptionService(paymentProvider);
    
    let expiringSubs;
    
    if (targetOrganizationId) {
      // Get all subscriptions for organization and filter
      const allSubs = await service.getOrganizationSubscriptions(targetOrganizationId);
      const now = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(now.getDate() + days);
      
      expiringSubs = allSubs.filter(sub => 
        sub.status === 'active' && 
        sub.periodEnd && 
        sub.periodEnd <= expiryDate &&
        sub.periodEnd >= now
      ).map(sub => ({
        ...sub,
        daysUntilExpiry: Math.ceil((sub.periodEnd!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      })).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    } else {
      // Admin view - all expiring subscriptions
      expiringSubs = await service.getExpiringSubscriptions(days);
    }
    
    return NextResponse.json({
      success: true,
      expiringSubscriptions: expiringSubs,
      count: expiringSubs.length,
      daysThreshold: days,
    });
    
  } catch (error: any) {
    console.error('Error getting expiring subscriptions:', error);
    return NextResponse.json(
      { error: `Failed to get expiring subscriptions: ${error.message}` },
      { status: 500 }
    );
  }
}