"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate, statusColors } from "@/lib/utils";
import type { Order, Perfume } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Stats { totalRevenue: number; totalOrders: number; totalProducts: number; pendingOrders: number; }

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();
  const [tab, setTab] = useState<"dashboard" | "orders" | "products">("dashboard");
  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, pendingOrders: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Perfume[]>([]);
  const [chartData, setChartData] = useState<{ month: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") { router.push("/"); return; }

      const [ordersRes, productsRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("perfumes").select("*").order("name"),
      ]);
      const allOrders = (ordersRes.data ?? []) as Order[];
      const allProducts = (productsRes.data ?? []) as Perfume[];
      setOrders(allOrders);
      setProducts(allProducts);

      const revenue = allOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total_amount, 0);
      const pending = allOrders.filter(o => o.status === "pending").length;
      setStats({ totalRevenue: revenue, totalOrders: allOrders.length, totalProducts: allProducts.length, pendingOrders: pending });

      // Build monthly chart data
      const monthMap: Record<string, number> = {};
      allOrders.forEach(o => {
        if (o.status === "cancelled") return;
        const month = new Date(o.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        monthMap[month] = (monthMap[month] ?? 0) + o.total_amount;
      });
      setChartData(Object.entries(monthMap).map(([month, revenue]) => ({ month, revenue })).slice(-6));
      setLoading(false);
    }
    load();
  }, []);

  const updateOrderStatus = async (orderId: number, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-rosewood-300 border-t-rosewood-700 rounded-full animate-spin" /></div>;

  const TABS = ["dashboard", "orders", "products"] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl font-bold text-bark mb-8">Admin Dashboard</h1>

      <div className="flex gap-1 mb-8 border-b border-rosewood-100">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors ${tab === t ? "border-rosewood-700 text-rosewood-700" : "border-transparent text-bark/50 hover:text-bark"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Revenue", value: formatPrice(stats.totalRevenue), color: "text-rosewood-700" },
              { label: "Total Orders", value: stats.totalOrders, color: "text-blue-600" },
              { label: "Products", value: stats.totalProducts, color: "text-green-600" },
              { label: "Pending Orders", value: stats.pendingOrders, color: "text-yellow-600" },
            ].map(s => (
              <div key={s.label} className="card p-5">
                <p className="text-xs text-bark/40 uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          {chartData.length > 0 && (
            <div className="card p-6">
              <h3 className="font-serif font-semibold text-bark mb-6">Monthly Revenue</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: number) => [formatPrice(v), "Revenue"]} />
                  <Bar dataKey="revenue" fill="#8b3020" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-rosewood-50 text-bark/60 text-xs uppercase tracking-wider">
              <tr>{["Order", "Date", "Amount", "Status", "Action"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-rosewood-50">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-rosewood-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold">#{order.id}</td>
                  <td className="px-4 py-3 text-bark/60">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(order.total_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)}
                      className="text-xs border border-bark/15 rounded-lg px-2 py-1 bg-white focus:outline-none">
                      {["pending", "processing", "shipped", "delivered", "cancelled"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "products" && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-rosewood-50 text-bark/60 text-xs uppercase tracking-wider">
              <tr>{["Product", "Price", "Stock", "Featured"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-rosewood-50">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-rosewood-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-bark">{p.name}</td>
                  <td className="px-4 py-3">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock_quantity < 5 ? "text-red-600 font-semibold" : "text-bark/70"}>{p.stock_quantity}</span>
                  </td>
                  <td className="px-4 py-3">
                    {p.is_featured ? <span className="text-xs bg-rosewood-100 text-rosewood-700 px-2 py-0.5 rounded-full">Featured</span> : <span className="text-bark/30">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
