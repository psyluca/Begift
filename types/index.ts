// ── Database row types ────────────────────────────────────────────────────────

export type ContentType = "image" | "video" | "pdf" | "link" | "message";
export type ReactionType = "emoji" | "text" | "photo" | "video" | "gift";

export interface Packaging {
  paperColor:     string;
  ribbonColor:    string;
  bowColor:       string;
  bowType:        "classic" | "star" | "rosette" | "simple" | "pompom";
  openAnimation:  "lift" | "unfold" | "explode" | "spin" | "shatter";
  sound:          "bells" | "pop" | "magic" | "woosh" | "chime" | "kawaii" | "none";
  theme?:         "standard" | "easter" | "graduation" | "birthday" | "kawaii";
}

export interface Profile {
  id:           string;
  email:        string;
  display_name: string | null;
  avatar_url:   string | null;
  created_at:   string;
}

export interface Gift {
  id:                string;
  creator_id:        string;
  recipient_name:    string;
  message:           string | null;
  packaging:         Packaging;
  content_type:      ContentType | null;
  content_url:       string | null;
  content_text:      string | null;
  content_file_name: string | null;
  created_at:        string;
  /** Se valorizzato, il gift è programmato per essere consegnato a
   *  quella data/ora. Fino ad allora il destinatario vede una waiting
   *  page con countdown, non il contenuto. Null = consegna immediata. */
  scheduled_at?:     string | null;
  /** Timestamp della prima apertura (migration 003). Null se mai aperto. */
  opened_at?:        string | null;
  /** Timestamp della prima condivisione (migration 003). */
  shared_at?:        string | null;
}

export interface Reaction {
  id:            string;
  gift_id:       string;
  reaction_type: ReactionType;
  emoji:         string | null;
  text:          string | null;
  media_url:     string | null;
  sender_name:   string;
  created_at:    string;
}

// ── API request/response types ───────────────────────────────────────────────

export interface CreateGiftBody {
  recipientName:   string;
  senderAlias?:    string | null;
  message?:        string | null;
  packaging:       Packaging;
  contentType?:    ContentType | null;
  contentUrl?:     string | null;
  contentText?:    string | null;
  contentFileName?: string | null;
  scheduledAt?:    string | null;
  // Template speciali (Festa della Mamma "Lettera che cresce", ecc.):
  // tipo del template + payload JSON con i campi strutturati specifici.
  template_type?:  string | null;
  template_data?:  Record<string, unknown> | null;
  // Multi-foto: media aggiuntivi oltre al content_url primario.
  // Array di oggetti { url, kind }. Massimo 9 elementi (10 totali
  // contando il primario).
  extra_media?:    Array<{ url: string; kind: "image" | "video" }> | null;
}

export interface CreateReactionBody {
  giftId:       string;
  type:         ReactionType;
  emoji?:       string;
  text?:        string;
  mediaUrl?:    string;
  senderName?:  string;
}

export interface UploadResponse {
  url:  string;
  path: string;
}
