import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface CheckoutItem { id: number; name: string; price: number; quantity: number; }
interface CheckoutBody {
  items: CheckoutItem[];
  shipping: { fullName: string; email: string; address: string; city: string; country: string };
  userId: string;
  totalAmount: number;
}

export async function POST(request: Request) {
  const body: CheckoutBody = await request.json();
  const { items, shipping, userId, totalAmount } = body;

  const supabase = await createServiceClient();

  // Create order in DB
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      status: "pending",
      total_amount: totalAmount,
      shipping_name: shipping.fullName,
      shipping_address: shipping.address,
      shipping_city: shipping.city,
      shipping_country: shipping.country,
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  // Create order items
  await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      perfume_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
    }))
  );

  // Try Stripe if key is set
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey, { apiVersion: "2026-05-27.dahlia" as any });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: items.map((item) => ({
          price_data: {
            currency: "usd",
            product_data: { name: item.name },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        })),
        success_url: `${appUrl}/order-confirmation?id=${order.id}`,
        cancel_url: `${appUrl}/cart`,
        metadata: { orderId: String(order.id) },
      });

      await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
      return NextResponse.json({ url: session.url });
    } catch (err) {
      console.error("Stripe error:", err);
    }
  }

  // No Stripe — return order ID for direct confirmation
  return NextResponse.json({ orderId: order.id });
}
