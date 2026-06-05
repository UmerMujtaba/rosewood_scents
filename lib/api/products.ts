export type ProductPayload = {
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock_quantity?: number;
  is_featured?: boolean;
  image_urls?: string[];
};

export async function getProducts() {
  const res = await fetch(`/api/admin/products`);
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  const body = await res.json();
  // API returns { data: [...] } — normalize to array
  return body?.data ?? body ?? [];
}

export async function createProduct(payload: ProductPayload) {
  const res = await fetch(`/api/admin/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Create product failed: ${res.status}`);
  return res.json();
}

export async function updateProduct(id: number, payload: Partial<ProductPayload>) {
  const res = await fetch(`/api/admin/products`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...payload }),
  });
  if (!res.ok) throw new Error(`Update product failed: ${res.status}`);
  return res.json();
}

export async function deleteProduct(id: number) {
  const res = await fetch(`/api/admin/products`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(`Delete product failed: ${res.status}`);
  return res.json();
}

export async function uploadImages(files: FileList) {
  const fd = new FormData();
  for (const f of Array.from(files)) fd.append("images", f);
  const res = await fetch(`/api/upload-images`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Image upload failed: ${res.status}`);
  return res.json();
}
