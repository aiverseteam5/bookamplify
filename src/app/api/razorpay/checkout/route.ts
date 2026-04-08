import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(_request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: author, error: authorError } = await supabase
    .from("authors")
    .select("id, name, email")
    .eq("user_id", user.id)
    .single();

  if (authorError || !author) {
    return NextResponse.json({ error: "Author profile not found" }, { status: 404 });
  }

  if (!process.env.RAZORPAY_PLAN_ID) {
    return NextResponse.json({ error: "RAZORPAY_PLAN_ID is not configured" }, { status: 500 });
  }

  try {
    const razorpay = getRazorpay();

    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      quantity: 1,
      total_count: 12,
      notes: {
        author_id: author.id,
        email: author.email,
      },
    });

    return NextResponse.json({ subscription_id: subscription.id, status: subscription.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create subscription";
    console.error("Razorpay checkout error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
