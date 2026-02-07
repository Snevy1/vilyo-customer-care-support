// app/api/subscriptions/[id]/route.ts - Single subscription operations
import { NextRequest, NextResponse } from 'next/server';
import { PaymentProviderFactory } from '../../factories/payment-provider.factory';
import { SubscriptionService } from '@/lib/subscriptions/services/subscription-service';
import { cookies } from 'next/headers';

// Helper to get subscription service with correct provider

type  ProductType  = 'web_chat'| 'whatsapp' | 'crm'
type providerType = "paystack" | "stripe" | "paypal"
async function getSubscriptionService(subscriptionId: string, productType: string, provider:providerType, organizationId?:string) {
  
  const paymentProvider = PaymentProviderFactory.createProvider(provider);
  return new SubscriptionService(paymentProvider);
}



// GET - Get subscription by organizationId/ organizationId

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string } > }
) {
  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get('user_session')?.value;
    
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { organization_id } = JSON.parse(userSession);
    const subscriptionData = await params;
    const subscriptionId = subscriptionData.id;
    
    // Get query parameters
    const url = new URL(request.url);
    const productType = url.searchParams.get('productType') as ProductType;
    const organizationIdParam = url.searchParams.get('organizationId');
    
    // Validate at least one lookup method is provided
    if (!productType) {
      return NextResponse.json(
        { error: 'productType query parameter is required' },
        { status: 400 }
      );
    }
    
    // Validate productType is valid
    const validProductTypes = ['web_chat', 'whatsapp', 'crm'];
    if (!validProductTypes.includes(productType)) {
      return NextResponse.json(
        { 
          error: 'Invalid product type. Must be one of: web_chat, whatsapp, crm',
          validTypes: validProductTypes 
        },
        { status: 400 }
      );
    }
    
    const service = await getSubscriptionService(subscriptionId, productType, 'stripe', organization_id );
    let subscription;
    
    // Determine which method to use based on parameters
    if (subscriptionId && subscriptionId !== 'organization') {
      // Using subscription ID lookup (original behavior)
      subscription = await service.getSubscriptionById(subscriptionId, productType);
      
      if (!subscription) {
        return NextResponse.json(
          { error: 'Subscription not found with provided subscriptionId' },
          { status: 404 }
        );
      }
    } else if (organizationIdParam) {
      // Using organization ID lookup (new behavior)
      subscription = await service.getSubscriptionByOrganizationId(organizationIdParam, productType);   
      if (!subscription) {
        return NextResponse.json(
          { error: 'Subscription not found for the provided organizationId' },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either subscriptionId in path or organizationId query parameter is required' },
        { status: 400 }
      );
    }
    
    // Check if user has access to this subscription
     // will do this later
     if (subscription.organizationId !== organization_id) {
      return NextResponse.json(
        { 
          error: 'Forbidden: You do not have access to this subscription',
          userOrganizationId: organization_id,
          subscriptionOrganizationId: subscription.organizationId
        },
        { status: 403 }
      );
    } 
    
    return NextResponse.json({ 
      success: true, 
      subscription,
      lookupMethod: subscriptionId !== 'organization' ? 'bySubscriptionId' : 'byOrganizationId'
    });
    
  } catch (error: any) {
    console.error('Error getting subscription:', error);
    
    // Handle validation errors differently
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      return NextResponse.json(
        { error: `Validation error: ${error.message}` },
        { status: 400 }
      );
    }
    
    // Handle database errors
    if (error.message.includes('database') || error.message.includes('connection')) {
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to get subscription',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Update subscription
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get('user_session')?.value;
    
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { organization_id } = JSON.parse(userSession);
    const subscriptionId = params.id;
    const body = await request.json();
    
    const { 
      productType,
      newPlanTier,
      newPlanId,
      metadata 
    } = body;
    
    if (!productType) {
      return NextResponse.json(
        { error: 'productType is required' },
        { status: 400 }
      );
    }
    
    // Verify the user has access to this subscription
    const service = await getSubscriptionService(subscriptionId, productType, 'stripe');
    const currentSub = await service.getSubscriptionById(subscriptionId, productType);
    
    if (!currentSub || currentSub.organizationId !== organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Update subscription
    const updated = await service.updateSubscription({
      subscriptionId,
      productType,
      newPlanTier,
      newPlanId,
      metadata,
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription updated successfully',
      subscription: updated 
    });
    
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: `Failed to update subscription: ${error.message}` },
      { status: 500 }
    );
  }
}

// PATCH - Partial update (like pause/resume)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get('user_session')?.value;
    
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { organization_id } = JSON.parse(userSession);
    const subscriptionId = params.id;
    const body = await request.json();
    
    const { 
      productType,
      action, // 'pause', 'resume', 'renew', 'upgrade', 'downgrade'
      data // Additional data for the action
    } = body;
    
    if (!productType || !action) {
      return NextResponse.json(
        { error: 'productType and action are required' },
        { status: 400 }
      );
    }
    
    const service = await getSubscriptionService(subscriptionId, productType, 'stripe', organization_id);
    const currentSub = await service.getSubscriptionById(subscriptionId, productType);
    
    if (!currentSub || currentSub.organizationId !== organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    let result;
    
    switch(action) {
      case 'pause':
        result = await service.pauseSubscription(subscriptionId, productType);
        break;
        
      case 'resume':
        result = await service.resumeSubscription(subscriptionId, productType);
        break;
        
      case 'renew':
        const renewForDays = data?.days || 30;
        result = await service.renewSubscription({
          subscriptionId,
          productType,
          renewForDays,
        });
        break;
        
      case 'upgrade':
      case 'downgrade':
        if (!data?.newPlanTier || !data?.newPlanId) {
          return NextResponse.json(
            { error: 'newPlanTier and newPlanId are required for upgrade/downgrade' },
            { status: 400 }
          );
        }
        result = await service.changeSubscriptionPlan(
          subscriptionId,
          productType,
          data.newPlanTier,
          data.newPlanId
        );
        break;
        
      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Subscription ${action}d successfully`,
      result 
    });
    
  } catch (error: any) {
    console.error('Error performing subscription action:', error);
    return NextResponse.json(
      { error: `Failed to perform action: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/delete subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get('user_session')?.value;
    
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { organization_id } = JSON.parse(userSession);
    const subscriptionId = params.id;
    
    // Get query params
    const url = new URL(request.url);
    const productType = url.searchParams.get('productType') as any;
    const hardDelete = url.searchParams.get('hardDelete') === 'true';
    const reason = url.searchParams.get('reason') || undefined;
    
    if (!productType) {
      return NextResponse.json(
        { error: 'productType query parameter is required' },
        { status: 400 }
      );
    }
    
    const service = await getSubscriptionService(subscriptionId, productType, 'stripe');
    const currentSub = await service.getSubscriptionById(subscriptionId, productType);
    
    if (!currentSub || currentSub.organizationId !== organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    let result;
    let message;
    
    if (hardDelete) {
      result = await service.deleteSubscription(subscriptionId, productType);
      message = 'Subscription permanently deleted';
    } else {
      result = await service.cancelSubscription(subscriptionId, productType, reason);
      message = 'Subscription cancelled';
    }
    
    return NextResponse.json({ 
      success: true, 
      message,
      result 
    });
    
  } catch (error: any) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { error: `Failed to delete subscription: ${error.message}` },
      { status: 500 }
    );
  }
}