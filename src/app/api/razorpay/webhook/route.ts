import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event: string; payload: Record<string, unknown> };
  try {
    event = JSON.parse(body) as { event: string; payload: Record<string, unknown> };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "payment.captured") {
    const supabase = createAdminClient();

    const paymentEntity = (event.payload["payment"] as Record<string, unknown> | undefined)?.["entity"] as Record<string, unknown> | undefined;
    const notes = paymentEntity?.["notes"] as Record<string, unknown> | undefined;
    const authorId = notes?.["author_id"] as string | undefined;
    const subscriptionId = paymentEntity?.["subscription_id"] as string | undefined;
    const contact = paymentEntity?.["contact"] as string | undefined;

    if (!authorId) {
      console.error("Missing author_id in payment notes");
      return NextResponse.json({ received: true });
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({
        razorpay_customer_id: contact ?? null,
        razorpay_subscription_id: subscriptionId ?? null,
        plan: "solo",
        status: "active",
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("author_id", authorId);

    if (error) {
      console.error("Failed to update subscription:", error);
    }
  }

  return NextResponse.json({ received: true });
}
