import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get author profile
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (authorError || !author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 404 })
    }

    const { priceId, plan } = await request.json()

    if (!priceId || !plan) {
      return NextResponse.json({ 
        error: 'Missing required parameters: priceId, plan' 
      }, { status: 400 })
    }

    const validPlans = ['trial', 'solo', 'team', 'enterprise']
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ 
        error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` 
      }, { status: 400 })
    }

    // Create or retrieve Stripe customer
    let customerId = author.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: author.name || user.email!,
        metadata: {
          supabase_user_id: user.id,
          author_id: author.id
        }
      })
      customerId = customer.id

      // Update author with Stripe customer ID
      await supabase
        .from('authors')
        .update({ stripe_customer_id: customerId })
        .eq('id', author.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
      metadata: {
        author_id: author.id,
        plan,
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ sessionId: session.id })

  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
