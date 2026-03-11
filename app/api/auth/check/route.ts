import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const userSession = cookieStore.get('user_session')?.value;
        
        if (!userSession) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }
        
        // Return success response
        return NextResponse.json({ 
            authenticated: true,
            session: userSession 
        });
        
    } catch (error) {
        console.error("Error during authentication flow:", error);
        return NextResponse.json(
            { authenticated: false, error: "Failed to authenticate" }, 
            { status: 500 }
        );
    }
}