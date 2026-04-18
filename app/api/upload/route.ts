import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer();

  // Solo utenti autenticati possono caricare nel bucket gift-media
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const bucket = (form.get("bucket") as string) || "gift-media";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // reaction-media è aperto a tutti (destinatario non autenticato)
  if (bucket === "gift-media" && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const folder = user ? user.id : "anon";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl, path });
}
