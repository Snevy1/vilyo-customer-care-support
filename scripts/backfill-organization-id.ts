// scripts/backfill-organization-id.ts
import 'dotenv/config'; // Add this at the very top
import { db } from "@/db/client";
import { chatBotMetadata, user } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";

async function backfillOrganizationId() {
    console.log("Starting backfill...");
    
    // Get all chatbots without organization_id
    const chatbots = await db
        .select()
        .from(chatBotMetadata)
        .where(isNull(chatBotMetadata.organization_id));
    
    console.log(`Found ${chatbots.length} chatbots to update`);
    
    for (const chatbot of chatbots) {
        // Get the user's organization_id
        const [userRecord] = await db
            .select({ organization_id: user.organization_id })
            .from(user)
            .where(eq(user.email, chatbot.user_email))
            .limit(1);
        
        if (userRecord?.organization_id) {
            await db
                .update(chatBotMetadata)
                .set({ organization_id: userRecord.organization_id })
                .where(eq(chatBotMetadata.id, chatbot.id));
            
            console.log(`✓ Updated chatbot ${chatbot.id}`);
        } else {
            console.error(`✗ No organization found for user ${chatbot.user_email}`);
        }
    }
    
    console.log("Backfill complete!");
    process.exit(0);
}

backfillOrganizationId().catch(console.error);