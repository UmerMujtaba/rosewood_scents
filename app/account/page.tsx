"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate, statusColors } from "@/lib/utils";
import type { OrderWithItems, PerfumeWithDetails, Profile } from "@/lib/types";
import { Package, Heart } from "lucide-react";

export default function AccountPage() {
  const supabase = createClient();
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "favorites">("orders");
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [favorites, setFavorites] = useState<PerfumeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      setUserName(((profile as unknown) as Profile)?.full_name ?? user.email ?? "");

      const { data: ordersData } = await supabase
        .from("orders")
        .select("*, order_items(*, perfume:perfumes(*))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders((ordersData as OrderWithItems[]) ?? []);

      const { data: favsData } = await supabase
        .from("user_favorites")
        .select("perfume:perfumes(*, perfume_categories(categories(*)), perfume_notes(scent_notes(*)))")
        .eq("user_id", user.id);
      const favPerfumes = (favsData ?? []).map((f: any) => ({
        ...f.perfume,
        categories: (f.perfume?.perfume_categories ?? []).map((pc: any) => pc.categories),
        scent_notes: (f.perfume?.perfume_notes ?? []).map((pn: any) => pn.scent_notes),
      }));
      setFavorites(favPerfumes);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-rosewood-300 border-t-rosewood-700 rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-10">
        <h1 className="font-serif text-3xl font-bold text-bark">My Account</h1>
        <p className="text-bark/50 mt-1">{userName}</p>
      </div>

      <div className="flex gap-1 mb-8 border-b border-rosewood-100">
        {(["orders", "favorites"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? "border-rosewood-700 text-rosewood-700" : "border-transparent text-bark/50 hover:text-bark"
            }`}
          >
            {t === "orders" ? <><Package className="w-4 h-4 inline mr-1.5" />Orders</> : <><Heart className="w-4 h-4 inline mr-1.5" />Favorites</>}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-bark/40">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No orders yet.</p>
              <Link href="/shop" className="btn-primary mt-4 inline-block">Start Shopping</Link>
            </div>
          ) : orders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-bark">Order #{order.id}</p>
                  <p className="text-xs text-bark/40">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {order.status}
                  </span>
                  <p className="font-bold text-bark">{formatPrice(order.total_amount)}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 bg-rosewood-50 rounded-lg px-2 py-1">
                    {item.perfume?.image_url && (
                      <div className="relative w-8 h-8 rounded overflow-hidden">
                        <Image src={item.perfume.image_url} alt={item.perfume.name} fill className="object-cover" />
                      </div>
                    )}
                    <span className="text-xs text-bark/70">{item.perfume?.name} × {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "favorites" && (
        <div>
          {favorites.length === 0 ? (
            <div className="text-center py-16 text-bark/40">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No saved favorites.</p>
              <Link href="/shop" className="btn-primary mt-4 inline-block">Explore Collection</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {favorites.map((p) => (
                <Link key={p.id} href={`/shop/${p.slug}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-rosewood-50">
                    {p.image_url ? (
                      <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : <div className="absolute inset-0 flex items-center justify-center text-3xl">🌹</div>}
                  </div>
                  <p className="font-serif font-semibold text-bark mt-2 text-sm">{p.name}</p>
                  <p className="text-rosewood-700 text-sm">{formatPrice(p.price)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
