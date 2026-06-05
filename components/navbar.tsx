"use client";
import Link from "next/link";
import { ShoppingBag, User, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function Navbar() {
  const { totalItems } = useCart();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setIsAdmin(data?.role === "admin");
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        setIsAdmin(data?.role === "admin");
      } else {
        setIsAdmin(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 bg-cream/95 backdrop-blur border-b border-rosewood-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-serif text-2xl font-bold text-bark tracking-tight">
            Rosewood Scents
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/shop" className="text-sm text-bark/70 hover:text-bark transition-colors">
              Shop Collection
            </Link>
            <Link href="/#story" className="text-sm text-bark/70 hover:text-bark transition-colors">
              Our Story
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/cart" className="relative p-2 text-bark/70 hover:text-bark transition-colors">
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rosewood-700 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                {isAdmin && (
                  <Link href="/admin" className="p-2 text-bark/70 hover:text-bark transition-colors" title="Admin">
                    <LayoutDashboard className="w-4 h-4" />
                  </Link>
                )}
                <Link href="/account" className="p-2 text-bark/70 hover:text-bark transition-colors">
                  <User className="w-4 h-4" />
                </Link>
                <button onClick={handleSignOut} className="p-2 text-bark/70 hover:text-bark transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login" className="text-sm text-bark/70 hover:text-bark transition-colors">Sign In</Link>
                <Link href="/register" className="text-sm bg-rosewood-700 text-white px-4 py-1.5 rounded-full hover:bg-rosewood-800 transition-colors">
                  Register
                </Link>
              </div>
            )}

            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t border-rosewood-100 flex flex-col gap-3">
            <Link href="/shop" className="text-sm text-bark" onClick={() => setMenuOpen(false)}>Shop Collection</Link>
            {user ? (
              <>
                <Link href="/account" className="text-sm text-bark" onClick={() => setMenuOpen(false)}>My Account</Link>
                {isAdmin && <Link href="/admin" className="text-sm text-bark" onClick={() => setMenuOpen(false)}>Admin</Link>}
                <button onClick={handleSignOut} className="text-sm text-bark text-left">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-bark" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link href="/register" className="text-sm text-bark" onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
