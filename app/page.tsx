import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import type { Perfume } from "@/lib/types";

export const revalidate = 60;

async function getFeaturedPerfumes(): Promise<Perfume[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("perfumes")
      .select("*")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(4);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedPerfumes();

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rosewood-950 via-rosewood-900 to-bark" />
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1588776814546-1ffbb-4a5d-b1b5-5c6e4a3b2a1b?w=1600')" }}
        />
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <p className="text-rosewood-300 text-sm font-semibold tracking-[0.3em] uppercase mb-6">
            Artisanal Fragrances
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Scent as an{" "}
            <span className="italic text-rosewood-300">Experience</span>
          </h1>
          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover a curated collection of artisanal fragrances, crafted with
            the finest ingredients from around the world. Elevate your presence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/shop"
              className="bg-rosewood-600 hover:bg-rosewood-700 text-white px-10 py-4 rounded-full font-semibold text-sm tracking-wide transition-colors"
            >
              Explore Collection
            </Link>
            <Link
              href="#story"
              className="border border-white/30 hover:border-white/60 text-white px-10 py-4 rounded-full font-semibold text-sm tracking-wide transition-colors"
            >
              Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="py-24 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-rosewood-600 text-xs font-semibold tracking-[0.3em] uppercase mb-3">
              Curated for You
            </p>
            <h2 className="font-serif text-4xl font-bold text-bark">Featured Fragrances</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} perfume={p} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/shop" className="btn-primary">
              View All Fragrances
            </Link>
          </div>
        </section>
      )}

      {/* Story */}
      <section id="story" className="py-24 bg-rosewood-50">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-rosewood-600 text-xs font-semibold tracking-[0.3em] uppercase mb-4">
              Our Philosophy
            </p>
            <h2 className="font-serif text-4xl font-bold text-bark mb-6">
              The Art of Fine Fragrance
            </h2>
            <p className="text-bark/70 leading-relaxed mb-4">
              At Rosewood Scents, we believe fragrance is more than a scent — it&apos;s a memory,
              an emotion, a statement of identity. Each bottle is a journey through the world&apos;s
              finest botanical gardens and spice routes.
            </p>
            <p className="text-bark/70 leading-relaxed mb-8">
              Our master perfumers craft each blend with patience and precision,
              balancing top, heart, and base notes to create something truly timeless.
            </p>
            <Link href="/shop" className="btn-secondary">
              Discover the Collection
            </Link>
          </div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-rosewood-100">
            <Image
              src="https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800"
              alt="Perfume crafting"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: "🌿", title: "Natural Ingredients", desc: "Sourced from sustainable farms and ethical suppliers worldwide." },
            { icon: "⚗️", title: "Master Crafted", desc: "Each fragrance is carefully blended by expert perfumers." },
            { icon: "📦", title: "Luxe Packaging", desc: "Delivered in premium packaging worthy of gifting." },
          ].map((item) => (
            <div key={item.title} className="text-center p-8 rounded-2xl bg-rosewood-50">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="font-serif text-xl font-semibold text-bark mb-2">{item.title}</h3>
              <p className="text-bark/60 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
