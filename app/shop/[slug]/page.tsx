"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, ChevronLeft, Minus, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/components/cart-context";
import { formatPrice } from "@/lib/utils";
import type { PerfumeWithDetails } from "@/lib/types";

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { addItem } = useCart();
  const supabase = createClient();

  const [perfume, setPerfume] = useState<PerfumeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFav, setIsFav] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase
        .from("perfumes")
        .select("*, perfume_categories(categories(*)), perfume_notes(scent_notes(*))")
        .eq("slug", slug)
        .single();

      if (!p) { setLoading(false); return; }

      const perfumeWithDetails: PerfumeWithDetails = {
        ...p,
        categories: (p.perfume_categories as any[]).map((pc) => pc.categories).filter(Boolean),
        scent_notes: (p.perfume_notes as any[]).map((pn) => pn.scent_notes).filter(Boolean),
      };
      setPerfume(perfumeWithDetails);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: fav } = await supabase
          .from("user_favorites")
          .select("perfume_id")
          .eq("user_id", user.id)
          .eq("perfume_id", p.id)
          .single();
        setIsFav(!!fav);
      }

      setLoading(false);
    }
    load();
  }, [slug]);

  const toggleFav = async () => {
    if (!userId || !perfume) { router.push("/login"); return; }
    if (isFav) {
      await supabase.from("user_favorites").delete().eq("user_id", userId).eq("perfume_id", perfume.id);
    } else {
      await supabase.from("user_favorites").insert({ user_id: userId, perfume_id: perfume.id });
    }
    setIsFav(!isFav);
  };

  const handleAddToCart = () => {
    if (!perfume) return;
    addItem(perfume, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rosewood-300 border-t-rosewood-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (!perfume) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-bark/50 text-lg">Fragrance not found.</p>
        <Link href="/shop" className="btn-primary">Back to Shop</Link>
      </div>
    );
  }

  const topNotes = perfume.scent_notes.filter((n) => n.note_type === "top");
  const midNotes = perfume.scent_notes.filter((n) => n.note_type === "middle");
  const baseNotes = perfume.scent_notes.filter((n) => n.note_type === "base");

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-bark/50 hover:text-bark mb-8 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Collection
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-rosewood-50">
          {perfume.image_url ? (
            <Image src={perfume.image_url} alt={perfume.name} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-8xl">🌹</div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="flex flex-wrap gap-2 mb-4">
            {perfume.categories.map((c) => (
              <span key={c.id} className="text-xs bg-rosewood-100 text-rosewood-700 px-3 py-1 rounded-full font-medium">
                {c.name}
              </span>
            ))}
          </div>

          <h1 className="font-serif text-4xl font-bold text-bark mb-2">{perfume.name}</h1>
          <p className="text-3xl font-bold text-rosewood-700 mb-6">{formatPrice(perfume.price)}</p>

          {perfume.description && (
            <p className="text-bark/70 leading-relaxed mb-8">{perfume.description}</p>
          )}

          {/* Scent Notes */}
          {(topNotes.length > 0 || midNotes.length > 0 || baseNotes.length > 0) && (
            <div className="bg-rosewood-50 rounded-xl p-5 mb-8">
              <h3 className="font-serif font-semibold text-bark mb-4">Scent Notes</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {[["Top", topNotes], ["Heart", midNotes], ["Base", baseNotes]].map(([label, notes]) => (
                  <div key={label as string}>
                    <p className="text-xs text-bark/40 uppercase tracking-wider font-semibold mb-2">{label}</p>
                    {(notes as typeof topNotes).map((n) => (
                      <p key={n.id} className="text-bark/80">{n.name}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center border border-bark/20 rounded-full">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 text-bark/60 hover:text-bark">
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 text-sm font-semibold">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2.5 text-bark/60 hover:text-bark">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button onClick={handleAddToCart} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              {added ? "Added to Cart!" : "Add to Cart"}
            </button>
            <button onClick={toggleFav} className="p-3 border border-bark/20 rounded-full hover:bg-rosewood-50 transition-colors">
              <Heart className={`w-5 h-5 ${isFav ? "fill-rosewood-600 text-rosewood-600" : "text-bark/50"}`} />
            </button>
          </div>

          <p className="text-xs text-bark/40">
            {perfume.stock_quantity > 0
              ? `${perfume.stock_quantity} in stock`
              : "Out of stock"}
          </p>
        </div>
      </div>
    </div>
  );
}
