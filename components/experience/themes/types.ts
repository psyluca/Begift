/**
 * Types for the Experience v2 theming system.
 *
 * Three layers:
 *  1. Environment → a coordinated visual world (Candy / Kawaii / ...)
 *  2. SeasonalSkin → a modifier applied on top of the environment
 *     (christmas / valentine / easter / halloween / birthday / none)
 *  3. GiftMetadata → per-gift personalization (recipient, sender, message, content)
 *
 * Scenes combine all three to produce a personalized cinematic moment.
 */

export type EnvironmentId = "candy" | "kawaii";

export type SeasonalSkinId =
  | "none"
  | "christmas"
  | "valentine"
  | "easter"
  | "halloween"
  | "birthday";

export interface ColorPalette {
  /** Main accent color (box body base, active states) */
  primary: string;
  /** Secondary accent (ribbon, bow, supporting surfaces) */
  secondary: string;
  /** Highlight / sparkle color */
  accent: string;
  /** Scene background */
  background: string;
  /** Surface behind box (glow base) */
  surface: string;
  /** Text color on dark background */
  textOnBg: string;
  /** Text color on light surface */
  textOnSurface: string;
  /** Color of the glow/halo around the box */
  glow: string;
  /** Palette of confetti/particle colors */
  confetti: string[];
}

/**
 * A visual "world" for the gift experience.
 * Identified by id; assets + components are looked up by id.
 */
export interface Environment {
  id: EnvironmentId;
  displayName: string;
  description: string;
  palette: ColorPalette;
}

/**
 * Per-gift personalization inputs.
 * Scenes read these to weave dynamic content into the animation.
 */
export interface GiftMetadata {
  recipientName?: string;
  senderAlias?: string;
  message?: string;
  contentType?: "money" | "voucher" | "message" | "playlist" | "photo";
  /** Overrides environment palette.accent if present */
  accentColor?: string;
  /** Deterministic seed for randomized variations within the same theme */
  seed?: string;
  /** Optional audio track URL */
  songUrl?: string;
  customSongTitle?: string;
}

/**
 * A fully resolved theme = environment + seasonal skin.
 */
export interface Theme {
  environment: Environment;
  seasonalSkin: SeasonalSkinId;
}

/**
 * Beats of the cinematic opening scene.
 * Durations are suggestive; the scene orchestrator decides the actual timing.
 */
export type SceneBeat =
  | "idle" // waiting for user interaction
  | "anticipation" // box pulses/glows stronger
  | "unlock" // bow detaches, ribbon unties
  | "burst" // light explosion from inside
  | "emerge" // contents rise out
  | "settle"; // box and contents at rest, content fully visible
