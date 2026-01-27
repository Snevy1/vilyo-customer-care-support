
import { db } from "@/db/client";
import scalekit from "@/lib/scalekit";
import { NextRequest, NextResponse } from "next/server";
import { user as User } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase Admin (Server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use Service Role Key for administrative actions
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  

  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  if (error) {
    return NextResponse.json({ error, error_description }, { status: 401 });
  }

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    const redirectUri = process.env.SCALEKIT_REDIRECT_URI!;
    const authResult = await scalekit.authenticateWithCode(code, redirectUri);

    const { user, idToken } = authResult;
    const claims = await scalekit.validateToken(idToken);

    const organizationId = (claims as any).organization_id || (claims as any).org_id || (claims as any).oid || null;

    if (!organizationId) {
      return NextResponse.json({ error: "No organization ID found" }, { status: 500 });
    }



    // --- START SUPABASE HANDSHAKE ---
    // We attempt to create the user. If they exist, we update their metadata.

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const emailParts = user.email.split('@')[0]; // "nevilsimiyu439"
const cleanName = emailParts
  .replace(/[0-9]/g, '') // remove numbers -> "nevilsimiyu"
  .split(/[._-]/) // split by dots or dashes if they exist
  .map(capitalize)
  .join(' '); // "Nevil Simiyu"

 const firstName = cleanName.split(' ')[0] || "User";
const lastName = cleanName.split(' ')[1] || "CRM";


    
    const { data: sbUser, error: sbError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      email_confirm: true, // Auto-confirm so they don't get a Supabase welcome email
      user_metadata: { 
      organization_id: organizationId,
      full_name: user?.name || cleanName || "anonymous", 
      first_name: firstName,
      last_name: lastName
      }
    });

   
    if (sbError && sbError.message.includes("already has been registered")) {
      // User exists, so we find them and update the organization_id just in case it changed
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === user.email);
    
      if (existingUser) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: { 
            organization_id: organizationId,
            full_name: user?.name || "anonymous"
          }
        });
      }
    }
    // --- END SUPABASE HANDSHAKE ---

    const existing = await db.select().from(User).where(eq(User.email, user.email));

    if (existing.length === 0) {
      await db.insert(User).values({
        email: user.email,
        name: user?.name || "anonymous",
        organization_id: organizationId
      });
    }

    const response = NextResponse.redirect(new URL("/", req.url));
    const userSession = {
      email: user.email,
      organization_id: organizationId
    };

    response.cookies.set("user_session", JSON.stringify(userSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (error) {
    console.error("Error during authentication flow:", error);
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
  }
}




// Original code

/* import { db } from "@/db/client";
import scalekit from "@/lib/scalekit";
import { NextRequest, NextResponse } from "next/server";
import { user as User} from "@/db/schema"
import { eq } from "drizzle-orm";

export async function GET(req:NextRequest) {
    const {searchParams} = req.nextUrl;

    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const error_description = searchParams.get("error_description");

    if(error){
        return NextResponse.json({
            error,
            error_description
        }, {status: 401})
    } 

    if(!code){
        return NextResponse.json({
            error: "No code provided"
        },{
            status: 400
        })
    }


    try {

        const redirectUri = process.env.SCALEKIT_REDIRECT_URI!;
        const authResult = await scalekit.authenticateWithCode(code, redirectUri);

        const {user, idToken} = authResult;

        const claims = await scalekit.validateToken(idToken);

        const organizationId =  (claims as any ).organization_id || (claims as any ).org_id || (claims as any).oid || null;

        if(!organizationId){
            return NextResponse.json({
                error: "No organization ID found in token claims"
            },{
                status: 500
            })
        }

        const existing = await db.select().from(User).where(eq(User.email, user.email));

        if(existing.length === 0){
            await db.insert(User).values({
                email: user.email,
                name: user?.name || "anonymous",
                organization_id: organizationId
            })
        };

        const response = NextResponse.redirect(new URL("/", req.url));
         const userSession = {
            email: user.email,
            organization_id: organizationId
         };


         response.cookies.set("user_session", JSON.stringify(userSession), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
         });

        return response; 



        
    } catch (error) {

        console.error("Error exchanging code:", error);
        return NextResponse.json({
            error: "Failed to authenticate user"
        }, {
            status: 500
        })
        
    }
} */