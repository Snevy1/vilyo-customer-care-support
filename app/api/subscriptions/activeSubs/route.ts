import { NextResponse } from 'next/server';
import { getSubscriptionData } from '@/lib/subscriptions/subscriptions';
import { cookies } from 'next/headers';


export async function GET() {
  try {
    const cookieStore = await cookies();
        const userSession = cookieStore.get('user_session')?.value;
        
        if (!userSession) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const { organization_id, email } = JSON.parse(userSession);
         const data = await getSubscriptionData(organization_id);
         return NextResponse.json(data);
    
  } catch (error) {
    console.log(error)
    
  }
 
  
}