"use client";
import { useCart } from "@/components/cart-context";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
        <ShoppingBag className="w-16 h-16 text-rosewood-200" />
        <h2 className="font-serif text-2xl font-bold text-bark">Your cart is empty</h2>
        <p className="text-bark/50">Discover our curated fragrances</p>
        <Link href="/shop" className="btn-primary">Shop Collection</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="font-serif text-3xl font-bold text-bark mb-10">
        Shopping Cart <span className="text-bark/30 text-xl">({totalItems})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.perfume_id} className="card flex gap-4 p-4">
              <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-rosewood-50 shrink-0">
                {(item.perfume.image_urls?.[0] || item.perfume.image_url) ? (
                  <Image src={item.perfume.image_urls?.[0] || item.perfume.image_url!} alt={item.perfume.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🌹</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/shop/${item.perfume.slug}`} className="font-serif font-semibold text-bark hover:text-rosewood-700 transition-colors">
                  {item.perfume.name}
                </Link>
                <p className="text-rosewood-700 font-semibold mt-1">{formatPrice(item.perfume.price)}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-bark/15 rounded-full">
                    <button onClick={() => updateQuantity(item.perfume_id, item.quantity - 1)} className="p-1.5 text-bark/50 hover:text-bark">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.perfume_id, item.quantity + 1)} className="p-1.5 text-bark/50 hover:text-bark">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.perfume_id)} className="text-bark/30 hover:text-red-500 transition-colors ml-auto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-bark">{formatPrice(item.perfume.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card p-6 h-fit">
          <h3 className="font-serif font-semibold text-bark text-lg mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-bark/60">
              <span>Subtotal ({totalItems} items)</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm text-bark/60">
              <span>Shipping</span>
              <span className="text-green-600">Free</span>
            </div>
          </div>
          <div className="border-t border-rosewood-100 pt-4 flex justify-between font-bold text-bark mb-6">
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <Link href="/checkout" className="btn-primary w-full text-center block">
            Proceed to Checkout
          </Link>
          <Link href="/shop" className="btn-secondary w-full text-center block mt-3">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
