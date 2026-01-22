import { db } from "@/db/client";
import { team_members } from "@/db/schema";
import { isAuthorized } from "@/lib/isAuthorized";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function GET(){
    try {

        const user = await isAuthorized();

        if(!user){
            return NextResponse.json({error: "Unauthorized"},
                {status: 401}
            )
        }

        const teamMembersData = await db.select({
            id: team_members.id,
            name: team_members.name,
            user_email: team_members.user_email,
            role: team_members.role,
            status: team_members.status,
            created_at: team_members.created_at,
        }).from(team_members).where(eq(team_members.organization_id, user.organization_id))


        return NextResponse.json({team:teamMembersData})

        


    } catch (error) {

        return NextResponse.json(
            {error: "Failed to fetch team members"},
            {status:500}
        )
        
    }
}