require('dotenv').config();
const axios = require('axios');

const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

// Function to get PayPal access token
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
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
        },
      }
    );
    return response.data.access_token;
  } catch (error:any) {
    throw new Error(error.response?.data?.message || 'Failed to get PayPal access token');
  }
}

// Express route handler to create a PayPal product and plan
const createPaypalProduct = async (req:any, res:any) => {
  const { name, description, amount, currency, interval, trial_period_days } = req.body;

  try {
    // Validate required fields
    if (!name || !amount || !currency || !interval) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    

    // Validate interval
    const validIntervals = ['day', 'week', 'month', 'year'];
    if (!validIntervals.includes(interval.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid interval. Must be day, week, month, or year' });
    }

    // Convert interval to PayPal format (uppercase)
    const intervalUnit = interval.toUpperCase();

    // Convert amount to PayPal format (dollars as string with 2 decimal places)
    const amountInDollars = (amount / 100).toFixed(2); // Amount received from frontend is in cents

    // Step 1: Get access token
    const accessToken = await getAccessToken();

    // Step 2: Create a Product
    const productRequestId = `PROD-${Date.now()}`;
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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': productRequestId,
        },
      }
    );
    const product = productResponse.data;

    // Step 3: Create a Plan
    const planRequestId = `PLAN-${Date.now()}`;
    const billingCycles = [
      {
        frequency: {
          interval_unit: intervalUnit,
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: trial_period_days > 0 ? 2 : 1, // If trial exists, regular is sequence 2
        total_cycles: 0, // 0 means indefinite
        pricing_scheme: {
          fixed_price: {
            value: amountInDollars,
            currency_code: currency.toUpperCase(),
          },
        },
      },
    ];

    // Add trial billing cycle if trial_period_days is provided
    if (trial_period_days > 0) {
      billingCycles.unshift({
        frequency: {
          interval_unit: 'DAY',
          interval_count: trial_period_days,
        },
        tenure_type: 'TRIAL',
        sequence: 1,
        total_cycles: 1, // Trial happens once
        pricing_scheme: {
          fixed_price: {
            value: '0.00',
            currency_code: currency.toUpperCase(),
          },
        },
      });
    }

    const planResponse = await axios.post(
      `${PAYPAL_API_BASE}/v1/billing/plans`,
      {
        product_id: product.id,
        name: `${name} ${interval.charAt(0).toUpperCase() + interval.slice(1)} Plan`,
        description: description || '',
        billing_cycles: billingCycles,
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: '0.00',
            currency_code: currency.toUpperCase(),
          },
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
        taxes: {
          percentage: '0',
          inclusive: false,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': planRequestId,
        },
      }
    );
    const plan = planResponse.data;

    // Return response  that will  be stored in db
    const response = {
      productId: product.id,
      planId: plan.id, // Equivalent to priceId in Stripe
      name: product.name,
      description: product.description,
      amount, // Return original amount in cents for consistency
      currency: currency.toLowerCase(),
      interval: interval.toLowerCase(),
      trial_period_days: trial_period_days || 0,
    };

    console.log(" PayPal Products created successfully", response);

    res.status(200).json(response);
  } catch (error:any) {
    console.error('Error creating PayPal subscription product:', error);
    res.status(500).json({ error: error.message || 'Failed to create PayPal product' });
  }
};

module.exports = createPaypalProduct;