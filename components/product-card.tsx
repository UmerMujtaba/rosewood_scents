"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { formatPrice } from "@/lib/utils";
import type { Perfume } from "@/lib/types";
import { useState } from "react";

interface ProductCardProps {
  perfume: Perfume;
  isFavorited?: boolean;
  onToggleFavorite?: (id: number) => void;
}

export function ProductCard({ perfume, isFavorited, onToggleFavorite }: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(perfume);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link href={`/shop/${perfume.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-rosewood-50">
        {((perfume.image_urls && perfume.image_urls[0]) || perfume.image_url) ? (
          <Image
            src={perfume.image_urls?.[0] || perfume.image_url!}
            alt={perfume.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-rosewood-100">
            <span className="text-4xl">🌹</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bark/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2">
          <button
            onClick={handleAdd}
            className="flex-1 bg-white text-bark text-xs font-semibold py-2 rounded-full hover:bg-rosewood-50 transition-colors flex items-center justify-center gap-1"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {added ? "Added!" : "Add to Cart"}
          </button>
        </div>
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite(perfume.id); }}
            className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${isFavorited ? "fill-rosewood-600 text-rosewood-600" : "text-bark/50"}`}
            />
          </button>
        )}
        {perfume.is_featured && (
          <span className="absolute top-3 left-3 bg-rosewood-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Featured
          </span>
        )}
      </div>
      <div className="mt-3 px-1">
        <h3 className="font-serif font-semibold text-bark group-hover:text-rosewood-700 transition-colors leading-tight">
          {perfume.name}
        </h3>
        <p className="text-rosewood-700 font-semibold text-sm mt-1">{formatPrice(perfume.price)}</p>
      </div>
    </Link>
  );
}
