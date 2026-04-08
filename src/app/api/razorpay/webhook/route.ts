import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RazorpayEntity {
  id?: string
  subscription_id?: string
  contact?: string
  notes?: Record<string, string>
}

interface RazorpayEvent {
  event: string
  payload: {
    payment?:      { entity?: RazorpayEntity }
    subscription?: { entity?: RazorpayEntity }
  }
}

function activateSolo(authorId: string, subscriptionId: string | undefined, customerId: string | undefined) {
  const supabase = createAdminClient()
  return supabase.from("subscriptions").update({
    razorpay_customer_id:     customerId ?? null,
    razorpay_subscription_id: subscriptionId ?? null,
    plan:   "solo",
    status: "active",
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }).eq("author_id", authorId)
}

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get("x-razorpay-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[razorpay/webhook] RAZORPAY_WEBHOOK_SECRET not set")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  // Verify HMAC-SHA256 signature
  const expectedSig = createHmac("sha256", webhookSecret).update(body).digest("hex")
  if (expectedSig !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  let event: RazorpayEvent
  try {
    event = JSON.parse(body) as RazorpayEvent
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const eventType = event.event

  // ── payment.captured: one-time or first payment of subscription ──────
  if (eventType === "payment.captured") {
    const payment = event.payload.payment?.entity
    const authorId = payment?.notes?.["author_id"]
    if (authorId) {
      const { error } = await activateSolo(authorId, payment?.subscription_id, payment?.contact)
      if (error) console.error("[razorpay/webhook] DB update failed:", error)
    }
  }

  // ── subscription.charged: recurring payment ───────────────────────────
  if (eventType === "subscription.charged") {
    const sub = event.payload.subscription?.entity
    const authorId = sub?.notes?.["author_id"]
    if (authorId) {
      const { error } = await activateSolo(authorId, sub?.id, undefined)
      if (error) console.error("[razorpay/webhook] subscription.charged DB update failed:", error)
    }
  }

  // ── subscription.cancelled / payment.failed ───────────────────────────
  if (eventType === "subscription.cancelled" || eventType === "payment.failed") {
    const sub = event.payload.subscription?.entity ?? event.payload.payment?.entity
    const authorId = sub?.notes?.["author_id"]
    if (authorId) {
      const supabase = createAdminClient()
      await supabase.from("subscriptions").update({ status: "cancelled" }).eq("author_id", authorId)
    }
  }

  return NextResponse.json({ received: true })
}
