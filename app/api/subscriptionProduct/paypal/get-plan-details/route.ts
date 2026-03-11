import { NextResponse } from 'next/server';
import axios from 'axios';

// Helper to get Access Token
const PAYPAL_API_BASE = 'https://api-m.paypal.com';
const clientId =  "AZcrT1ij_T9iOYxrOmmdBIjpD_JvtAtUc_blIAGXXdQWY3Li1iLnFn21KJjepVa60vvlBP5x5SGZcQxz" //process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

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



export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const planId = searchParams.get('planId');

  if (!planId) return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });

  try {
    const accessToken = await getAccessToken(); // Your existing token helper
    
    const response = await axios.get(
      `${PAYPAL_API_BASE}/v1/billing/plans/${planId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // This returns the Product ID associated with that Plan
    return NextResponse.json({
      success: true,
      plan_id: response.data.id,
      product_id: response.data.product_id, 
      status: response.data.status,
      name: response.data.name
    });
  } catch (error: any) {
    console.error("PayPal Error Details:", error.response?.data);
    return NextResponse.json({ 
      error: "Plan not found", 
      details: error.response?.data || "Check your Sandbox/Live environment settings." 
    }, { status: 404 });
  }
}

// curl command for testing

/* curl -X GET "http://localhost:3000/api/subscriptionProduct/paypal/get-plan-details?planId=P-8K851338LE4706930NGIAWTQ" */