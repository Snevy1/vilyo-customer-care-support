import { db } from "@/db/client";
import { team_members } from "@/db/schema";
import { isAuthorized } from "@/lib/isAuthorized";
import scalekit from "@/lib/scalekit";

import { error } from "console";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function POST(req:Request){
    try {

        const LoggedInuser = await isAuthorized();
        
                if(!LoggedInuser){
                    return NextResponse.json({error: "Unauthorized"},
                        {status: 401}
                    )
                }


        const {email, name} = await req.json();

        if(!email){
            return NextResponse.json({error:"Email is required"},{status:400})
        }

        const pendingTeamMember = await db.select().from(team_members).where(eq(team_members.user_email, email));


        if(pendingTeamMember.length > 0){
            return NextResponse.json({
                error: "User is already invited"
            },
        {
            status: 400
        })
        }

        const {user} = await scalekit.user.createUserAndMembership(LoggedInuser.organization_id, 
            {
                email,
            userProfile: {
                firstName: name || email.spli("@")[0],
                lastName: ""

            },
            sendInvitationEmail: true,
            }
            
        );


    await db.insert(team_members).values({
        user_email: email,
        name: name || email.spli("@")[0],
        organization_id: LoggedInuser.organization_id,


    });


    return NextResponse.json({user});


        
    } catch (error) {

        return NextResponse.json({
            error: "Failed to add team member"
        },{
            status: 500
        })
        
    }
}