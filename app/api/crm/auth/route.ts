import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get user email from your AI App session/cookie
  const sessionCookie = req.cookies.get("user_session")?.value;
  if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { email } = JSON.parse(sessionCookie);

  // Generate a link that logs the user in and redirects to the CRM port
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
    options: { 
      // This is where your Atomic CRM is running
      redirectTo: 'http://localhost:5173/dashboard' 
    }
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return the link to the frontend
  return NextResponse.json({ url: data.properties.action_link });
}