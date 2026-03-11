import { db } from '../client.ts';  // Adjust based on your db connection path
import { subscriptionPlans } from "../schema.ts";

async function seedPlans() {
  console.log("🌱 Seeding PayPal Plans...");

  const plans = [
    {
      name: "Vilyo Support AI (Web Only)",
      slug: "web-support-basic",
      description: "Standard web-based chatbot for your website.",
      productId: "PROD-10349113AH7231608",
      externalPlanId: "P-3AS187416C269694RNGIEDRY",
      price: 2900, // $29.00
      provider: "paypal",
      limits: {
        whatsapp_enabled: false,
        webchat_enabled: true,
        max_messages: 1000,
      },
      features: ["Custom Branding", "Web Widget", "AI Training"],
    },
    {
      name: "WhatsApp Chatbot Plan",
      slug: "whatsapp-only",
      description: "Automate your customer support on WhatsApp.",
      productId: "PROD-10349113AH7231608",
      externalPlanId: "P-0D976339TV311024ENGIETFQ",
      price: 3900, // $39.00
      provider: "paypal",
      limits: {
        whatsapp_enabled: true,
        webchat_enabled: false,
        max_messages: 2000,
      },
      features: ["WhatsApp Integration", "Auto-Replies", "Contact Sync"],
    },
    {
      name: "Webchatbot + WhatsApp Bundle",
      slug: "full-ai-bundle",
      description: "The complete package for web and mobile support.",
      productId: "PROD-10349113AH7231608",
      externalPlanId: "P-45V132265G642635JNGIEHGA",
      price: 5900, // $59.00
      provider: "paypal",
      limits: {
        whatsapp_enabled: true,
        webchat_enabled: true,
        max_messages: 5000,
      },
      features: ["Everything in Web + WhatsApp", "Priority Support", "Analytics"],
    },
  ];

  for (const plan of plans) {
    await db.insert(subscriptionPlans).values(plan).onConflictDoUpdate({
      target: subscriptionPlans.externalPlanId,
      set: plan,
    });
  }

  console.log("✅ PayPal Plans seeded successfully!");
}


async function main() {
  try {
    await seedPlans();
    console.log("✅ Seeding completed");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
