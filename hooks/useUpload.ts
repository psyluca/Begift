"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export type Bucket = "gift-media" | "reaction-media";

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File, bucket: Bucket = "gift-media"): Promise<string> => {
    setUploading(true);
    setError(null);
    try {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: "begift-session",
        },
      });
      const ext  = file.name.split(".").pop() ?? "bin";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: err } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (err) throw new Error(err.message);

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}
