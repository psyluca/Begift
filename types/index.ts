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
  senderAlias?:    string;
  message?:        string;
  packaging:       Packaging;
  contentType?:    ContentType;
  contentUrl?:     string;
  contentText?:    string;
  contentFileName?: string;
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
