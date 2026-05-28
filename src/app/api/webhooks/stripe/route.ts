import { NextResponse } from "next/server";

import {
  constructStripeEvent,
  processStripeWebhookEvent,
} from "@/features/billing/server/webhooks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  try {
    const payload = await request.text();
    const event = await constructStripeEvent(payload, signature);
    const result = await processStripeWebhookEvent(event);

    return NextResponse.json({ received: true, duplicate: result.duplicate });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 400 });
  }
}
