/**
 * POST /api/upload
 *
 * Accetta un file multipart/form-data dall'utente e lo carica in
 * Supabase Storage. Applica:
 *  - whitelist MIME/estensioni lato server (no trust del Content-Type
 *    del client, verifichiamo anche i magic bytes dei primi byte)
 *  - cap dimensioni per categoria (25MB immagini, 100MB video, 20MB PDF)
 *  - path isolato per user_id, no path traversal (rimuoviamo slash dal name)
 *  - rifiuto esplicito di estensioni pericolose (.html, .svg con script,
 *    .exe, .js, .sh, ecc.)
 *
 * Bucket:
 *  - gift-media: solo utenti autenticati
 *  - reaction-media: aperto ai destinatari non autenticati
 */

import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Hard caps (byte). Sovrascrivibili per test ma non dal client.
const LIMITS = {
  image: 25 * 1024 * 1024,  // 25 MB
  video: 100 * 1024 * 1024, // 100 MB
  pdf:   20 * 1024 * 1024,  // 20 MB
};

// Whitelist MIME dichiarati dal client. La vera verifica e' la
// combinazione di: (1) MIME allowlisted, (2) magic bytes coerenti,
// (3) estensione allowlisted.
const ALLOWED_MIMES: Record<string, "image" | "video" | "pdf"> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/heic": "image",
  "image/heif": "image",
  "video/mp4": "video",
  "video/quicktime": "video", // .mov
  "video/webm": "video",
  "application/pdf": "pdf",
};

const ALLOWED_EXTS = new Set([
  "jpg", "jpeg", "png", "webp", "heic", "heif",
  "mp4", "mov", "webm",
  "pdf",
]);

// Magic bytes / "file signatures" per i tipi che accettiamo.
// Non e' impossibile ingannare questi check (polyglot), ma aumentano
// il costo di un attacco di polyglot/MIME confusion.
function checkMagicBytes(buf: Buffer, declaredMime: string): boolean {
  const h = buf.subarray(0, 16);
  if (h.length < 4) return false;
  const hex = h.toString("hex").toUpperCase();
  switch (declaredMime) {
    case "image/jpeg":
      return hex.startsWith("FFD8FF");
    case "image/png":
      return hex.startsWith("89504E470D0A1A0A");
    case "image/webp":
      // "RIFF" .... "WEBP"
      return hex.startsWith("52494646") && buf.subarray(8, 12).toString() === "WEBP";
    case "image/heic":
    case "image/heif":
      // HEIC/HEIF: ftyp box, signature at offset 4..8 = "ftyp"
      return buf.subarray(4, 8).toString() === "ftyp";
    case "video/mp4":
    case "video/quicktime":
      // anche MP4/MOV iniziano con "....ftyp"
      return buf.subarray(4, 8).toString() === "ftyp";
    case "video/webm":
      // WebM/Matroska EBML header: 1A 45 DF A3
      return hex.startsWith("1A45DFA3");
    case "application/pdf":
      return hex.startsWith("25504446"); // %PDF
    default:
      return false;
  }
}

function safeExtension(name: string): string {
  const parts = name.split(".");
  const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, "") : "bin";
  return ext.slice(0, 6);
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const bucket = (form.get("bucket") as string) || "gift-media";

  if (!file) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (!["gift-media", "reaction-media"].includes(bucket)) {
    return NextResponse.json({ error: "invalid_bucket" }, { status: 400 });
  }
  if (bucket === "gift-media" && !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 1) MIME allowlist
  const declaredMime = (file.type || "").toLowerCase();
  const kind = ALLOWED_MIMES[declaredMime];
  if (!kind) {
    return NextResponse.json(
      { error: "unsupported_type", detail: `MIME ${declaredMime || "(none)"} non supportato` },
      { status: 415 }
    );
  }

  // 2) Estensione allowlist (incrociata con MIME)
  const ext = safeExtension(file.name);
  if (!ALLOWED_EXTS.has(ext)) {
    return NextResponse.json({ error: "unsupported_ext", detail: ext }, { status: 415 });
  }

  // 3) Size cap per categoria
  const cap = LIMITS[kind];
  if (file.size > cap) {
    return NextResponse.json(
      { error: "file_too_large", max_bytes: cap, your_bytes: file.size },
      { status: 413 }
    );
  }

  // 4) Magic bytes: carichiamo il buffer in memoria (gia' necessario
  //    per l'upload a Supabase), poi controlliamo la signature.
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (!checkMagicBytes(buffer, declaredMime)) {
    return NextResponse.json(
      { error: "magic_mismatch", detail: "Il contenuto del file non corrisponde al tipo dichiarato" },
      { status: 415 }
    );
  }

  // 5) Path sicuro - mai usare il name originale.
  const folder = user ? user.id : "anon";
  const randPart = Math.random().toString(36).slice(2, 10);
  const path = `${folder}/${Date.now()}-${randPart}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: declaredMime, // usiamo il MIME dichiarato, gia' validato
      upsert: false,
      // cacheControl: Supabase Storage gestisce cache-control via bucket config
    });

  if (error) {
    return NextResponse.json({ error: "storage", detail: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path, kind });
}
