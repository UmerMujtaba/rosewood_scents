"use client";
import { useCart } from "@/components/cart-context";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", address: "", city: "", country: "US",
  });

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-bark/50">Your cart is empty.</p>
        <Link href="/shop" className="btn-primary">Shop Now</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.perfume_id, name: i.perfume.name, price: i.perfume.price, quantity: i.quantity })),
          shipping: form,
          userId: user.id,
          totalAmount: totalPrice,
        }),
      });

      const data = await res.json();
      if (data.url) {
        clearCart();
        window.location.href = data.url;
      } else if (data.orderId) {
        clearCart();
        router.push(`/order-confirmation?id=${data.orderId}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="font-serif text-3xl font-bold text-bark mb-10">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="font-serif text-xl font-semibold text-bark">Shipping Information</h2>
          {[
            { label: "Full Name", key: "fullName", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: "Address", key: "address", type: "text" },
            { label: "City", key: "city", type: "text" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-bark/70 mb-1">{label}</label>
              <input
                type={type}
                required
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="input"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-bark/70 mb-1">Country</label>
            <select
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="input"
            >
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="IN">India</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Processing..." : "Place Order"}
          </button>
        </form>

        {/* Summary */}
        <div>
          <h2 className="font-serif text-xl font-semibold text-bark mb-6">Order Summary</h2>
          <div className="space-y-3 mb-6">
            {items.map((item) => {
              const productImage = item.perfume.image_urls?.[0] || item.perfume.image_url;
              return (
                <div key={item.perfume_id} className="flex items-center gap-3">
                  <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-rosewood-50 shrink-0">
                    {productImage ? (
                      <Image src={productImage} alt={item.perfume.name} fill className="object-cover" />
                    ) : <div className="absolute inset-0 flex items-center justify-center">🌹</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-bark truncate">{item.perfume.name}</p>
                    <p className="text-xs text-bark/50">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-bark">{formatPrice(item.perfume.price * item.quantity)}</p>
                </div>
              );
            })}
          </div>
          <div className="border-t border-rosewood-100 pt-4">
            <div className="flex justify-between font-bold text-bark">
              <span>Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
