import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-bark text-white/70 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-serif text-xl font-bold text-white mb-3">Rosewood Scents</h3>
            <p className="text-sm leading-relaxed">
              Artisanal fragrances crafted with the finest ingredients from around the world.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Explore</h4>
            <div className="flex flex-col gap-2">
              <Link href="/shop" className="text-sm hover:text-white transition-colors">Shop Collection</Link>
              <Link href="/cart" className="text-sm hover:text-white transition-colors">Cart</Link>
              <Link href="/account" className="text-sm hover:text-white transition-colors">My Account</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Legal</h4>
            <div className="flex flex-col gap-2">
              <Link href="#" className="text-sm hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="text-sm hover:text-white transition-colors">Terms of Service</Link>
              <Link href="#" className="text-sm hover:text-white transition-colors">Returns</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-8 text-center text-xs">
          © {new Date().getFullYear()} Rosewood Scents. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
