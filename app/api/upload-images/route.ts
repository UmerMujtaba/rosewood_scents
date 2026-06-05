import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const BUCKET_NAME = process.env.SUPABASE_IMAGE_BUCKET ?? "perfume-images";

export async function POST(request: Request) {
  const supabase = await createServiceClient();
  const formData = await request.formData();
  const files = formData.getAll("images").filter((item): item is File => item instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No images provided." }, { status: 400 });
  }

  const bucketList = await supabase.storage.listBuckets();
  if (bucketList.error) {
    return NextResponse.json({ error: bucketList.error.message }, { status: 500 });
  }

  const bucketExists = bucketList.data?.some((bucket) => bucket.name === BUCKET_NAME);
  if (!bucketExists) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
    });
    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
  }

  const urls: string[] = [];
  for (const file of files) {
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData, error: urlError } = await supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    if (urlError || !urlData?.publicUrl) {
      return NextResponse.json({ error: urlError?.message ?? "Failed to create public URL." }, { status: 500 });
    }

    urls.push(urlData.publicUrl);
  }

  return NextResponse.json({ urls });
}
