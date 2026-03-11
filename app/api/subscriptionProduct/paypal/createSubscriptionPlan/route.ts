import { NextResponse } from 'next/server';
import axios from 'axios';

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
const clientId = process.env.PAYPAL_CLIENT_ID; 
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

// Helper to get Access Token
async function getAccessToken() {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  try {
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    throw new Error('Failed to fetch PayPal token');
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      productId, // Pass your existing ID here
      planName, 
      description, 
      amount, 
      currency, 
      interval, 
      trial_period_days 
    } = body;

    // 1. Validation
    if (!productId || !amount || !currency || !interval) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const intervalUnit = interval.toUpperCase();
    const amountInDollars = (amount / 100).toFixed(2);
    const accessToken = await getAccessToken();

    // 2. Define Billing Cycles
    const billingCycles: any[] = [
      {
        frequency: {
          interval_unit: intervalUnit,
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: trial_period_days > 0 ? 2 : 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: {
            value: amountInDollars,
            currency_code: currency.toUpperCase(),
          },
        },
      },
    ];

    if (trial_period_days > 0) {
      billingCycles.unshift({
        frequency: { interval_unit: 'DAY', interval_count: trial_period_days },
        tenure_type: 'TRIAL',
        sequence: 1,
        total_cycles: 1,
        pricing_scheme: {
          fixed_price: { value: '0.00', currency_code: currency.toUpperCase() },
        },
      });
    }

    // 3. Create the Plan for the existing Product
    const planResponse = await axios.post(
      `${PAYPAL_API_BASE}/v1/billing/plans`,
      {
        product_id: productId, // Using your existing Product ID
        name: planName,
        description: description || '',
        status: "ACTIVE", // Ensures the plan is ready to use immediately
        billing_cycles: billingCycles,
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: { value: '0.00', currency_code: currency.toUpperCase() },
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': `PLAN-${Date.now()}`,
        },
      }
    );

    console.log("PayPal Plan created successfully", planResponse.data, planResponse.data.id, productId, planResponse.data.status);
    return NextResponse.json({
      planId: planResponse.data.id,
      productId: productId,
      status: planResponse.data.status
    });

  } catch (error: any) {
    console.error('PayPal Plan Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}


// curl command for testing

/* curl -X POST http://localhost:3000/api/subscriptionProduct/paypal/createSubscriptionPlan \
-H "Content-Type: application/json" \
-d '{
  "productId": "PROD-10349113AH7231608", 
  "planName": "whatsapp chatbot plan",
  "description": "Access to all features of whatsapp",
  "amount": 3000,
  "currency": "USD",
  "interval": "MONTH",
  "trial_period_days": 7
}' */



// Result


/* PayPal Plan created successfully {
  id: 'P-45V132265G642635JNGIEHGA',
  product_id: 'PROD-10349113AH7231608',
  name: 'Webchatbot + whatsapp',
  status: 'ACTIVE',
  description: 'Access to all features including whatsapp bot',
  usage_type: 'LICENSED',
  create_time: '2026-02-14T09:42:48Z',
  links: [
    {
      href: 'https://api.sandbox.paypal.com/v1/billing/plans/P-45V132265G642635JNGIEHGA',
      rel: 'self',
      method: 'GET',
      encType: 'application/json'
    },
    {
      href: 'https://api.sandbox.paypal.com/v1/billing/plans/P-45V132265G642635JNGIEHGA',
      rel: 'edit',
      method: 'PATCH',
      encType: 'application/json'
    },
    {
      href: 'https://api.sandbox.paypal.com/v1/billing/plans/P-45V132265G642635JNGIEHGA/deactivate',
      rel: 'self',
      method: 'POST',
      encType: 'application/json'
    }
  ]
} P-45V132265G642635JNGIEHGA PROD-10349113AH7231608 ACTIVE */