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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  try {
    const accessToken = await getAccessToken();
    
    // Added 'total_required=true' to help you with pagination on the frontend later
    const response = await axios.get(
      `${PAYPAL_API_BASE}/v1/billing/plans?product_id=${productId}&page_size=10&page=1&total_required=true`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    console.log("Plans",response.data )

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}


// Results


/* Plans {
  plans: [
    {
      id: 'P-3AS187416C269694RNGIEDRY',
      product_id: 'PROD-10349113AH7231608',
      name: 'Vilyo Support AI MONTH Plan',
      status: 'ACTIVE',
      usage_type: 'LICENSED',
      create_time: '2026-02-14T09:35:03Z',
      links: [Array]
    },
    {
      id: 'P-45V132265G642635JNGIEHGA',
      product_id: 'PROD-10349113AH7231608',
      name: 'Webchatbot + whatsapp',
      status: 'ACTIVE',
      description: 'Access to all features including whatsapp bot',
      usage_type: 'LICENSED',
      create_time: '2026-02-14T09:42:48Z',
      links: [Array]
    }
  ],
  total_items: 2,
  total_pages: 1,
  links: [
    {
      href: 'https://api.sandbox.paypal.com/v1/billing/plans?product_id=PROD-10349113AH7231608&page_size=10&page=1',
      rel: 'self',
      method: 'GET',
      encType: 'application/json'
    }
  ]
} */