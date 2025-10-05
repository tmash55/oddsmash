import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { createCustomerPortal } from "@/libs/stripe";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const body = await req.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // User who are not logged in can't make a purchase
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to view billing information." },
        { status: 401 }
      );
    } else if (!body.returnUrl) {
      return NextResponse.json(
        { error: "Return URL is required" },
        { status: 400 }
      );
    }

    // Get customer_id from subscriptions (brand-scoped)
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('customer_id')
      .eq('user_id', user.id)
      .eq('brand_key', 'oddsmash')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Make a purchase first." },
        { status: 400 }
      );
    }

    const stripePortalUrl = await createCustomerPortal({
      customerId: sub.customer_id,
      returnUrl: body.returnUrl,
    });

    return NextResponse.json({
      url: stripePortalUrl,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
