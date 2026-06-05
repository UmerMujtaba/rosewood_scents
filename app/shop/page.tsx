import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import type { Category, Perfume } from "@/lib/types";

export const revalidate = 60;

async function getData() {
  try {
    const supabase = await createClient();
    const [perfumesRes, categoriesRes] = await Promise.all([
      supabase.from("perfumes").select("*").order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);
    return {
      perfumes: (perfumesRes.data ?? []) as Perfume[],
      categories: (categoriesRes.data ?? []) as Category[],
    };
  } catch {
    return { perfumes: [], categories: [] };
  }
}

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function ShopPage({ searchParams }: PageProps) {
  const { category, q } = await searchParams;
  const { perfumes, categories } = await getData();

  let filtered = perfumes;
  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        (p.description ?? "").toLowerCase().includes(lower)
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl font-bold text-bark mb-3">The Collection</h1>
        <p className="text-bark/60">A meticulously curated selection of fine fragrances, each with its own story and soul.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="md:w-48 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-bark/50 mb-4">Categories</p>
          <div className="flex flex-col gap-1">
            <a
              href="/shop"
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${!category ? "bg-rosewood-100 text-rosewood-800 font-semibold" : "text-bark/70 hover:text-bark"}`}
            >
              All Fragrances
            </a>
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${category === cat.slug ? "bg-rosewood-100 text-rosewood-800 font-semibold" : "text-bark/70 hover:text-bark"}`}
              >
                {cat.name}
              </a>
            ))}
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {/* Search */}
          <form className="mb-8">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search fragrances..."
              className="input max-w-xs"
            />
          </form>

          {filtered.length === 0 ? (
            <div className="text-center py-24 text-bark/40">
              <p className="text-lg">No fragrances found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((p) => (
                <ProductCard key={p.id} perfume={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
