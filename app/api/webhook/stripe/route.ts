import configFile from "@/config";
import { findCheckoutSession } from "@/libs/stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
  typescript: true,
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// This is where we receive Stripe webhook events
// It used to update the user data, send emails, etc...
// By default, it'll store the user in the database
// See more: https://shipfa.st/docs/features/payments
export async function POST(req: NextRequest) {
  const body = await req.text();

  const signature = headers().get("stripe-signature");

  let eventType;
  let event;

  // Create a private supabase client using the secret service_role API key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase env. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
    return NextResponse.json({ error: "Server misconfigured (supabase)" }, { status: 500 });
  }
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET env var.");
    return NextResponse.json({ error: "Server misconfigured (webhook secret)" }, { status: 500 });
  }
  const supabase = createServiceClient(supabaseUrl, supabaseServiceKey);

  // verify Stripe event is legit
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed. ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  eventType = event.type;

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        // First payment is successful and a subscription is created (if mode was set to "subscription" in ButtonCheckout)
        // ✅ Grant access to the product
        const stripeObject: Stripe.Checkout.Session = event.data
          .object as Stripe.Checkout.Session;

        const session = await findCheckoutSession(stripeObject.id);

        const customerId = session?.customer;
        const priceId = session?.line_items?.data[0]?.price.id;
        const userId = stripeObject.client_reference_id;
        const plan = configFile.stripe.plans.find((p) => p.priceId === priceId);
        const brandKey = (session?.metadata as any)?.brand_key || 'oddsmash';

        const customer = (await stripe.customers.retrieve(
          customerId as string
        )) as Stripe.Customer;

        // Proceed even if plan is not found in config to avoid skipping DB writes in test

        let user;
        if (!userId) {
          // check if user already exists
          const { data: profile, error: existingProfileErr } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", customer.email)
            .single();
          if (existingProfileErr) {
            console.error('profiles select by email error', existingProfileErr);
          }
          if (profile) {
            user = profile;
          } else {
            // create a new user using supabase auth admin
            const { data, error: createUserErr } = await supabase.auth.admin.createUser({
              email: customer.email,
            });
            if (createUserErr) {
              console.error('auth.admin.createUser error', createUserErr);
            }
            user = data?.user;
          }
        } else {
          // find user by ID
          const { data: profile, error: profileByIdErr } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
          if (profileByIdErr) {
            console.error('profiles select by id error', profileByIdErr);
          }
          user = profile;
        }

        // Update legacy access flags for backwards compat
        const userIdToUse = (user as any)?.id as string | undefined;
        if (userIdToUse) {
          const { error: upsertProfileErr } = await supabase
            .from('profiles')
            .upsert(
              {
                id: userIdToUse,
                email: (customer.email as string) || null,
                has_access: true,
                last_brand: brandKey,
                last_sub_updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
          if (upsertProfileErr) {
            console.error('profiles upsert error', upsertProfileErr);
          }
        }

        // Write to subscriptions table (brand-scoped), handling both subscription and one-time payments
        try {
          const price = session?.line_items?.data?.[0]?.price as Stripe.Price | undefined;
          const productId = price
            ? (typeof price.product === 'string' ? price.product : (price.product as Stripe.Product)?.id)
            : null;

          const subscriptionId = typeof session?.subscription === 'string' ? (session.subscription as string) : null;
          let status: string = 'active';
          let cancelAtPeriodEnd = false;
          let currentPeriodEnd: string | null = null;
          if (subscriptionId) {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            status = sub.status as string;
            cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
            const sec = (sub as any)?.current_period_end;
            currentPeriodEnd = typeof sec === 'number' && Number.isFinite(sec)
              ? new Date(sec * 1000).toISOString()
              : null;
          }

          const record = {
            user_id: userIdToUse as string,
            brand_key: brandKey,
            provider: 'stripe',
            customer_id: String(customerId || ''),
            subscription_id: subscriptionId ?? `cs_${String(session?.id)}`,
            product_id: productId ?? null,
            price_id: String(priceId || ''),
            status,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: cancelAtPeriodEnd,
            updated_at: new Date().toISOString(),
          } as any;

          const { error: subErr } = await supabase
            .from('subscriptions')
            .upsert(record, { onConflict: 'subscription_id' });
          if (subErr) {
            console.error('Supabase subscriptions upsert error', subErr);
          }
        } catch (e) {
          console.error('Failed to write subscription record', e);
        }

        // Extra: send email with user link, product page, etc...
        // try {
        //   await sendEmail(...);
        // } catch (e) {
        //   console.error("Email issue:" + e?.message);
        // }

        break;
      }

      case "checkout.session.expired": {
        // User didn't complete the transaction
        // You don't need to do anything here, by you can send an email to the user to remind him to complete the transaction, for instance
        break;
      }

      case "customer.subscription.updated": {
        // Sync status/cancel_at_period_end/current_period_end so portal changes reflect immediately
        try {
          const sub: Stripe.Subscription = event.data.object as Stripe.Subscription;
          const status = sub.status as string;
          const cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
          const sec = (sub as any)?.current_period_end;
          const currentPeriodEnd = typeof sec === 'number' && Number.isFinite(sec)
            ? new Date(sec * 1000).toISOString()
            : null;

          // Update subscription row by subscription_id
          const { error: updateSubErr } = await supabase
            .from('subscriptions')
            .update({
              status,
              cancel_at_period_end: cancelAtPeriodEnd,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq('subscription_id', sub.id);
          if (updateSubErr) {
            console.error('subscriptions update error', updateSubErr);
          }

          // Update profile last_sub_status for the same user
          const { data: subRow } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('subscription_id', sub.id)
            .maybeSingle();

          if (subRow?.user_id) {
            const { error: updateProfileErr } = await supabase
              .from('profiles')
              .update({
                last_brand: 'oddsmash',
                last_sub_status: status,
                last_sub_updated_at: new Date().toISOString(),
              })
              .eq('id', subRow.user_id);
            if (updateProfileErr) {
              console.error('profiles update last_sub_status error', updateProfileErr);
            }
          }
        } catch (e) {
          console.error('Failed to sync subscription update', e);
        }
        break;
      }

      case "customer.subscription.deleted": {
        // The customer subscription stopped
        // ❌ Revoke access to the product
        const stripeObject: Stripe.Subscription = event.data
          .object as Stripe.Subscription;
        const subscription = await stripe.subscriptions.retrieve(
          stripeObject.id
        );

        // Map customer to user via subscriptions table, then update profile by user_id
        try {
          const { data: subRow, error: findByCustomerErr } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('customer_id', String(subscription.customer))
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (findByCustomerErr) {
            console.error('subscriptions select by customer error', findByCustomerErr);
          }

          if (subRow?.user_id) {
            const { error: cancelProfileErr } = await supabase
              .from('profiles')
              .update({
                has_access: false,
                last_brand: 'oddsmash',
                last_sub_status: 'canceled',
                last_sub_updated_at: new Date().toISOString(),
              })
              .eq('id', subRow.user_id);
            if (cancelProfileErr) {
              console.error('profiles cancel update error', cancelProfileErr);
            }
          }
        } catch (e) {
          console.error('Failed to map cancellation to profile', e);
        }
        try {
          const { error: cancelSubErr } = await supabase
            .from('subscriptions')
            .update({ status: 'canceled', updated_at: new Date().toISOString() })
            .eq('customer_id', String(subscription.customer));
          if (cancelSubErr) {
            console.error('subscriptions cancel update error', cancelSubErr);
          }
        } catch (e) {
          console.error('Failed to update subscription cancellation', e);
        }
        break;
      }

      case "invoice.paid": {
        // Customer just paid an invoice (for instance, a recurring payment for a subscription)
        // ✅ Grant access to the product
        const stripeObject: Stripe.Invoice = event.data
          .object as Stripe.Invoice;
        const customerId = stripeObject.customer;
        // Map to user via subscriptions table and update profile access
        try {
          const { data: subRow, error: paidFindErr } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('customer_id', String(customerId))
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (paidFindErr) {
            console.error('subscriptions select for invoice.paid error', paidFindErr);
          }

          if (subRow?.user_id) {
            const { error: paidProfileErr } = await supabase
              .from('profiles')
              .update({
                has_access: true,
                last_brand: 'oddsmash',
                last_sub_status: 'active',
                last_sub_updated_at: new Date().toISOString(),
              })
              .eq('id', subRow.user_id);
            if (paidProfileErr) {
              console.error('profiles update after invoice.paid error', paidProfileErr);
            }
          }
        } catch (e) {
          console.error('Failed to map invoice to profile', e);
        }
        try {
          const { error: paidSubErr } = await supabase
            .from('subscriptions')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('customer_id', String(customerId));
          if (paidSubErr) {
            console.error('subscriptions update after invoice.paid error', paidSubErr);
          }
        } catch (e) {
          console.error('Failed to update subscription after invoice paid', e);
        }

        break;
      }

      case "invoice.payment_failed":
        // A payment failed (for instance the customer does not have a valid payment method)
        // ❌ Revoke access to the product
        // ⏳ OR wait for the customer to pay (more friendly):
        //      - Stripe will automatically email the customer (Smart Retries)
        //      - We will receive a "customer.subscription.deleted" when all retries were made and the subscription has expired

        break;

      default:
      // Unhandled event type
    }
  } catch (e) {
    console.error("stripe error: ", e.message);
  }

  return NextResponse.json({});
}
