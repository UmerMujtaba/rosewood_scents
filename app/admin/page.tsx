"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate, statusColors } from "@/lib/utils";
import type { Order, Perfume } from "@/lib/types";
import { useProducts } from "@/hooks/useProducts";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Pencil, Trash2 } from "lucide-react";

interface Stats { totalRevenue: number; totalOrders: number; totalProducts: number; pendingOrders: number; }

interface ProductFormState {
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  imageUrls: string[];
  stock_quantity: number;
  is_featured: boolean;
}

export default function AdminPage() {
  const supabase = createClient();
  const sb = supabase as any;
  const router = useRouter();
  const [tab, setTab] = useState<"dashboard" | "orders" | "products">("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const { query: productsQuery, create: createProductMut, update: updateProductMut, remove: removeProductMut } = useProducts();
  const products = (productsQuery.data ?? []) as Perfume[];
  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, pendingOrders: 0 });
  const [chartData, setChartData] = useState<{ month: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Perfume | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>({
    name: "",
    slug: "",
    description: "",
    price: 0,
    image_url: "",
    imageUrls: [],
    stock_quantity: 0,
    is_featured: false,
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [productMessage, setProductMessage] = useState<string | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const userRes = await (supabase.auth.getUser() as any);
      const user = userRes?.data?.user;
      if (!user) { router.push("/login"); return; }
      const profileRes = await (supabase.from("profiles").select("role").eq("id", user.id).single() as any);
      const profile = profileRes?.data as any;
      if (profile?.role !== "admin") { router.push("/"); return; }

      const ordersRes = await sb.from("orders").select("*").order("created_at", { ascending: false });
      const allOrders = (ordersRes.data ?? []) as Order[];
      setOrders(allOrders);

      const revenue = allOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total_amount, 0);
      const pending = allOrders.filter(o => o.status === "pending").length;
      setStats({ totalRevenue: revenue, totalOrders: allOrders.length, totalProducts: products.length, pendingOrders: pending });

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

  useEffect(() => {
    // keep stats.totalProducts in sync with products list without causing loops
    const total = products.length;
    setStats(prev => {
      if (prev.totalProducts === total) return prev;
      return { ...prev, totalProducts: total };
    });
  }, [products.length]);

  const updateOrderStatus = async (orderId: number, status: string) => {
    await sb.from("orders").update({ status } as any).eq("id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      slug: "",
      description: "",
      price: 0,
      image_url: "",
      imageUrls: [],
      stock_quantity: 0,
      is_featured: false,
    });
    setProductMessage(null);
    setIsProductFormOpen(false);
  };

  const openNewProduct = () => {
    resetProductForm();
    setIsProductFormOpen(true);
    setTab("products");
  };

  const editProduct = (product: Perfume) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      price: product.price,
      image_url: product.image_url ?? "",
      imageUrls: product.image_urls && product.image_urls.length > 0 ? product.image_urls : product.image_url ? [product.image_url] : [],
      stock_quantity: product.stock_quantity,
      is_featured: product.is_featured,
    });
    setProductMessage(null);
    setIsProductFormOpen(true);
  };

  const getPrimaryImage = (product: Perfume) => {
    return (product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : product.image_url) ?? null;
  };

  const removeProductImage = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const uploadProductImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    setProductMessage(null);

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append("images", file, file.name);
    });

    const response = await fetch("/api/upload-images", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      setProductMessage(error || "Image upload failed.");
      setUploadingImages(false);
      return;
    }

    const result = await response.json();
    if (result.error) {
      setProductMessage(result.error);
      setUploadingImages(false);
      return;
    }

    const newUrls = result.urls as string[];
    setProductForm(prev => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ...newUrls],
      image_url: prev.image_url || newUrls[0] || "",
    }));
    setUploadingImages(false);
  };

  const saveProduct = async () => {
    if (!productForm.name || productForm.price === undefined) {
      setProductMessage("Name and price are required.");
      return;
    }

    setSavingProduct(true);
    const imageUrls = productForm.imageUrls.length > 0
      ? productForm.imageUrls
      : (editingProduct as any)?.image_urls ?? (productForm.image_url ? [productForm.image_url] : []);

    const payload = {
      name: productForm.name,
      slug: productForm.slug,
      description: productForm.description ?? null,
      price: Number(productForm.price),
      image_url: imageUrls.length > 0 ? imageUrls[0] : null,
      image_urls: imageUrls,
      stock_quantity: Number(productForm.stock_quantity ?? 0),
      is_featured: Boolean(productForm.is_featured),
    };

    try {
      if (editingProduct) {
        await updateProductMut.mutateAsync({ id: editingProduct.id, payload });
        setProductMessage("Product updated successfully.");
      } else {
        await createProductMut.mutateAsync(payload as any);
        setProductMessage("Product created successfully.");
        setProductForm({ name: "", slug: "", description: "", price: 0, image_url: "", imageUrls: [], stock_quantity: 0, is_featured: false });
      }
      setEditingProduct(null);
      setIsProductFormOpen(false);
    } catch (err: any) {
      setProductMessage(err?.message ?? String(err));
    }

    setSavingProduct(false);
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Delete this product? This action cannot be undone.")) return;
    setProductMessage(null);
    try {
      await removeProductMut.mutateAsync(id);
      setProductMessage("Product deleted.");
    } catch (err: any) {
      setProductMessage(err?.message ?? String(err));
    }
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
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-bark">Products</h2>
              <p className="text-sm text-bark/60">Manage catalog items and update inventory in the database.</p>
            </div>
            <button onClick={openNewProduct} className="btn-primary inline-flex items-center justify-center px-4 py-2">
              Add Product
            </button>
          </div>

          {isProductFormOpen && (
            <div className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-bark">{editingProduct ? "Edit Product" : "Create Product"}</h3>
                  <p className="text-sm text-bark/60">Store changes directly in Supabase so product pages update immediately.</p>
                </div>
                <button onClick={resetProductForm} className="text-sm text-bark/60 hover:text-bark transition-colors">Cancel</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-bark">Name</span>
                  <input
                    value={productForm.name ?? ""}
                    onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="input mt-2 w-full"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-bark">Slug</span>
                  <input
                    value={productForm.slug ?? ""}
                    onChange={e => setProductForm(prev => ({ ...prev, slug: e.target.value }))}
                    className="input mt-2 w-full"
                  />
                </label>

                <label className="block lg:col-span-2">
                  <span className="text-sm font-semibold text-bark">Description</span>
                  <textarea
                    value={productForm.description ?? ""}
                    onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    className="input mt-2 w-full min-h-[120px] resize-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-bark">Price</span>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price ?? 0}
                    onChange={e => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="input mt-2 w-full"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-bark">Stock Quantity</span>
                  <input
                    type="number"
                    value={productForm.stock_quantity ?? 0}
                    onChange={e => setProductForm(prev => ({ ...prev, stock_quantity: Number(e.target.value) }))}
                    className="input mt-2 w-full"
                  />
                </label>

                <label className="block lg:col-span-2">
                  <span className="text-sm font-semibold text-bark">Product Images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => uploadProductImages(e.target.files)}
                    className="mt-2 w-full text-sm text-bark"
                  />
                  <p className="text-xs text-bark/50 mt-2">Upload multiple images and save them directly to Supabase Storage.</p>
                </label>

                {productForm.imageUrls.length > 0 && (
                  <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {productForm.imageUrls.map((url, index) => (
                      <div key={`${url}-${index}`} className="relative rounded-xl overflow-hidden bg-rosewood-50 border border-rosewood-100">
                        <Image src={url} alt={`Image ${index + 1}`} width={400} height={400} className="object-cover h-32 w-full" />
                        <button
                          onClick={() => removeProductImage(index)}
                          type="button"
                          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 text-red-600 flex items-center justify-center text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="flex items-center gap-3 mt-4 lg:col-span-2">
                  <input
                    type="checkbox"
                    checked={Boolean(productForm.is_featured)}
                    onChange={e => setProductForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="h-4 w-4 rounded border-bark/20 text-rosewood-700 focus:ring-rosewood-500"
                  />
                  <span className="text-sm text-bark">Mark as featured</span>
                </label>
              </div>

              {productMessage && <p className="mt-4 text-sm text-red-600">{productMessage}</p>}

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={saveProduct}
                  disabled={savingProduct}
                  className="btn-primary inline-flex items-center justify-center px-5 py-2"
                >
                  {savingProduct ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
                <button
                  onClick={resetProductForm}
                  type="button"
                  className="border border-bark/20 rounded-lg px-5 py-2 text-sm text-bark/80 hover:bg-rosewood-50"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-rosewood-50 text-bark/60 text-xs uppercase tracking-wider">
                <tr>
                  { ["Product", "Price", "Stock", "Featured", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  )) }
                </tr>
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
                    <td className="px-4 py-3 flex items-center gap-3">
                      <button onClick={() => editProduct(p)} className="text-rosewood-700 hover:text-rosewood-900" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-600 hover:text-red-800" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
