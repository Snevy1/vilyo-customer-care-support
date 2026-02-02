
import { db } from "@/db/client";
import scalekit from "@/lib/scalekit";
import { NextRequest, NextResponse } from "next/server";
import { organizations, user as User } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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


  
// We use onConflictDoNothing so we don't crash if  organization id it's already there
await db.insert(organizations)
  .values({
    id: organizationId,
    name: (claims as any).organization_name || "My Business",
    email: user.email, 
    owner_email: user.email,
    timezone: 'UTC' 
  })
  .onConflictDoUpdate({
    target: organizations.id,
    set: { updated_at: new Date() }
  });

    // Name parsing
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const emailParts = user.email.split('@')[0];
    const cleanName = emailParts
      .replace(/[0-9]/g, '')
      .split(/[._-]/)
      .map(capitalize)
      .join(' ');
    const firstName = cleanName.split(' ')[0] || "User";
    const lastName = cleanName.split(' ')[1] || "CRM";

    let supabaseUserId: string | undefined;

    // Check if user already exists
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
if (usersError) {
  console.error("Failed to fetch users:", usersError);
  return NextResponse.json({ error: "Failed to check user existence" }, { status: 500 });
}

    const existingUser = users.find(u => u.email === user.email);

    if (existingUser) {
      // User exists - update metadata (trigger will auto-update profiles)
      supabaseUserId = existingUser.id;
      
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          organization_id: organizationId,
          full_name: user?.name || cleanName || "anonymous",
          first_name: firstName,
          last_name: lastName
        }
      });
    } else {
      // User doesn't exist - create new user (trigger will auto-create profile)
      const { data: sbUser, error: sbError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        user_metadata: {
          organization_id: organizationId,
          full_name: user?.name || cleanName || "anonymous",
          first_name: firstName,
          last_name: lastName
        }
      });

      if (sbError) {
        console.error("Failed to create Supabase user:", sbError);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }

      supabaseUserId = sbUser.user?.id;
    }

    // Update  existing Drizzle User table (keep this as it's separate)
    const existing = await db.select().from(User).where(eq(User.email, user.email));

    if (existing.length === 0) {
      await db.insert(User).values({
        email: user.email,
        name: user?.name || "anonymous",
        organization_id: organizationId
      });
    } else {
      await db.update(User)
        .set({ organization_id: organizationId })
        .where(eq(User.email, user.email));
    }

    const response = NextResponse.redirect(new URL("/", req.url));
    const userSession = {
      email: user.email,
      userId: supabaseUserId,
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