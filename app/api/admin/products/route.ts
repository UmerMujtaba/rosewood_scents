import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServiceClient();
  const sb = supabase as any;
  try {
    const body = await request.json();
    const payload = body?.payload ?? body;
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Empty or invalid json" }, { status: 400 });
    }

    // Try insert with image_urls first (if column exists in remote schema)
    const { data, error } = await sb.from("perfumes").insert(payload).select().single();
    if (error) {
      const msg = error.message ?? "Unknown error";
      const missingColumn = /image_urls|column .* does not exist/i.test(msg);
      if (missingColumn) {
        // Retry without image_urls
        const legacy = { ...payload };
        delete (legacy as any).image_urls;
        const { data: d2, error: e2 } = await sb.from("perfumes").insert(legacy).select().single();
        if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
        return NextResponse.json({ data: d2 });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await createServiceClient();
  const sb = supabase as any;
  try {
    // try selecting including image_urls first
    const selectCols = "id,name,slug,description,price,image_urls,image_url,stock_quantity,is_featured,created_at";
    const { data, error } = await sb.from("perfumes").select(selectCols).order("name");
    if (error) {
      const msg = error.message ?? "Unknown error";
      const missingColumn = /image_urls|column .* does not exist/i.test(msg);
      if (missingColumn) {
        const fallback = "id,name,slug,description,price,image_url,stock_quantity,is_featured,created_at";
        const { data: d2, error: e2 } = await sb.from("perfumes").select(fallback).order("name");
        if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
        // normalize to include image_urls as empty array if not present
        const normalized = (d2 ?? []).map((p: any) => ({ ...p, image_urls: p.image_url ? [p.image_url] : [] }));
        return NextResponse.json({ data: normalized });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = await createServiceClient();
  const sb = supabase as any;
  try {
    const body = await request.json();
    const id = body?.id ?? body?.payload?.id;
    const payload = body?.payload ?? (() => {
      if (!body || typeof body !== "object") return null;
      const { id: _id, ...rest } = body;
      return rest;
    })();

    if (!id) return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Empty or invalid json" }, { status: 400 });
    }

    const { data, error } = await sb.from("perfumes").update(payload).eq("id", id).select().single();
    if (error) {
      const msg = error.message ?? "Unknown error";
      const missingColumn = /image_urls|column .* does not exist/i.test(msg);
      if (missingColumn) {
        const legacy = { ...payload };
        delete (legacy as any).image_urls;
        const { data: d2, error: e2 } = await sb.from("perfumes").update(legacy).eq("id", id).select().single();
        if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
        return NextResponse.json({ data: d2 });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createServiceClient();
  const sb = supabase as any;
  try {
    const body = await request.json();
    const id = body.id;
    if (!id) return NextResponse.json({ error: "Missing product id" }, { status: 400 });

    const { data, error } = await sb.from("perfumes").delete().eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
