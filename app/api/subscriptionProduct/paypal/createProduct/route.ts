import { NextResponse } from 'next/server';
import axios from 'axios';

const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

async function getAccessToken() {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
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
}

export async function POST(req: Request) {
  try {
    const { name, description, amount, currency, interval, trial_period_days } = await req.json();

    // 1. Validation
    if (!name || !amount || !currency || !interval) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const amountInDollars = (amount / 100).toFixed(2);

    // 2. Create Product
    const productResponse = await axios.post(
      `${PAYPAL_API_BASE}/v1/catalogs/products`,
      {
        name,
        description: description || '',
        type: 'SERVICE',
        category: 'SOFTWARE',
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': `PROD-${Date.now()}`,
        },
      }
    );
    const product = productResponse.data;

    console.log("PayPal Product created successfully", product);

    // 3. Setup Billing Cycles
    const billingCycles: any[] = [
      {
        frequency: { interval_unit: interval.toUpperCase(), interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: trial_period_days > 0 ? 2 : 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: { value: amountInDollars, currency_code: currency.toUpperCase() },
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

    // 4. Create Plan
    const planResponse = await axios.post(
      `${PAYPAL_API_BASE}/v1/billing/plans`,
      {
        product_id: product.id,
        name: `${name} ${interval} Plan`,
        status: "ACTIVE",
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
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': `PLAN-${Date.now()}`,
        },
      }
    );

    console.log("PayPal Product and Plan created successfully", {
      product: productResponse.data,
      plan: planResponse.data,
    });

    return NextResponse.json({
      productId: product.id,
      planId: planResponse.data.id,
      status: planResponse.data.status
    });

  } catch (error: any) {
    console.error('PayPal Error:', error.response?.data || error.message);
    return NextResponse.json({ error: error.response?.data || 'Server Error' }, { status: 500 });
  }
}

// curl command for testing

//curl -X POST http://localhost:3000/api/subscriptionProduct/paypal/createProduct -H "Content-Type: application/json" -d "{\"name\": \"Vilyo Support AI\", \"description\": \"Basic Support Plan\", \"amount\": 2900, \"currency\": \"USD\", \"interval\": \"MONTH\", \"trial_period_days\": 0}"

// Results


/* PayPal Product created successfully {
  id: 'PROD-10349113AH7231608',
  name: 'Vilyo Support AI',
  description: 'Basic Support Plan',
  create_time: '2026-02-14T09:35:02Z',
  links: [
    {
      href: 'https://api.sandbox.paypal.com/v1/catalogs/products/PROD-10349113AH7231608',
      rel: 'self',
      method: 'GET'
    },
    {
      href: 'https://api.sandbox.paypal.com/v1/catalogs/products/PROD-10349113AH7231608',
      rel: 'edit',
      method: 'PATCH'
    }
  ]
}
PayPal Product and Plan created successfully {
  product: {
    id: 'PROD-10349113AH7231608',
    name: 'Vilyo Support AI',
    description: 'Basic Support Plan',
    create_time: '2026-02-14T09:35:02Z',
    links: [ [Object], [Object] ]
  },
  plan: {
    id: 'P-3AS187416C269694RNGIEDRY',
    product_id: 'PROD-10349113AH7231608',
    name: 'Vilyo Support AI MONTH Plan',
    status: 'ACTIVE',
    usage_type: 'LICENSED',
    create_time: '2026-02-14T09:35:03Z',
    links: [ [Object], [Object], [Object] ]
  }
} */