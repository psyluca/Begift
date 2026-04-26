"use client";

/**
 * MultiPhotoGallery — rendering di un album foto dentro al gift.
 *
 * Strategia di layout:
 *  - 1 foto       → polaroid singola ruotata (stesso PolaroidPhoto del flow base)
 *  - 2-4 foto     → stack di polaroid sovrapposte, sfogliabili tap-tap
 *  - 5+ foto      → griglia 2x2/3x3 con tap per ingrandire (lightbox)
 *
 * Pattern emotivo: lo stack richiama il "scartare il regalo" che e'
 * il cuore di BeGift. Per album lunghi usiamo griglia per usabilita'.
 *
 * Props:
 *  - photos: array di URL. Il primo e' tipicamente content_url, i
 *    successivi vengono da extra_media. Il chiamante li unisce.
 *  - caption: opzionale, mostrata sotto.
 */

import { useState } from "react";

const ROSE = "#fff";
const BORDER = "rgba(220,200,170,.7)";

interface Props {
  photos: string[];
  caption?: string | null;
}

export function MultiPhotoGallery({ photos, caption }: Props) {
  const [stackIndex, setStackIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (photos.length === 0) return null;

  // 1 foto → polaroid singola
  if (photos.length === 1) {
    return <SinglePolaroid src={photos[0]} caption={caption} />;
  }

  // 2-4 foto → stack sfogliabile
  if (photos.length <= 4) {
    return (
      <div style={{ marginBottom: 20, padding: "20px 0" }}>
        <div style={{
          position: "relative",
          width: "min(280px, 80vw)",
          height: "min(280px, 80vw)",
          margin: "0 auto",
        }}>
          {photos.map((src, i) => {
            const isTop = i === stackIndex;
            const offset = (i - stackIndex + photos.length) % photos.length;
            const rotation = offset === 0 ? -2 : offset === 1 ? 4 : offset === 2 ? -6 : 7;
            return (
              <button
                key={i}
                onClick={() => setStackIndex((stackIndex + 1) % photos.length)}
                aria-label={`Foto ${i + 1} di ${photos.length}`}
                style={{
                  position: "absolute",
                  inset: 0,
                  padding: 10,
                  background: "#fff",
                  border: "10px solid #fff",
                  boxShadow: "0 12px 30px rgba(0,0,0,.18)",
                  transform: `rotate(${rotation}deg) translateZ(0)`,
                  zIndex: photos.length - offset,
                  opacity: offset === 0 ? 1 : 0.92,
                  transition: "transform .35s cubic-bezier(.34,1.56,.64,1), opacity .25s",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <img
                  src={src}
                  alt=""
                  style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                />
                {/* Scotch carta solo sulla foto in cima */}
                {isTop && (
                  <div style={{
                    position: "absolute", top: -10, left: "50%",
                    transform: "translateX(-50%) rotate(-5deg)",
                    width: 70, height: 18,
                    background: BORDER,
                    boxShadow: "0 1px 2px rgba(0,0,0,.1)",
                  }}/>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "#888" }}>
          {stackIndex + 1} di {photos.length} · tocca per sfogliare
        </div>
        {caption && (
          <p style={{
            textAlign: "center", marginTop: 14,
            fontFamily: "Georgia, serif", fontStyle: "italic",
            fontSize: 15, color: "#3d3d3d", lineHeight: 1.5,
            maxWidth: 380, margin: "14px auto 0",
          }}>
            &ldquo;{caption}&rdquo;
          </p>
        )}
      </div>
    );
  }

  // 5+ foto → griglia con lightbox
  const cols = photos.length >= 9 ? 3 : 2;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 8,
      }}>
        {photos.map((src, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            aria-label={`Apri foto ${i + 1} di ${photos.length}`}
            style={{
              padding: 0, border: "none", background: "transparent",
              cursor: "pointer", aspectRatio: "1 / 1", overflow: "hidden",
              borderRadius: 10, position: "relative",
            }}
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
            />
          </button>
        ))}
      </div>
      {caption && (
        <p style={{
          textAlign: "center", marginTop: 14,
          fontFamily: "Georgia, serif", fontStyle: "italic",
          fontSize: 15, color: "#3d3d3d", lineHeight: 1.5,
        }}>
          &ldquo;{caption}&rdquo;
        </p>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,.92)",
            zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            aria-label="Chiudi"
            style={{
              position: "absolute", top: 16, right: 16,
              background: "rgba(255,255,255,.15)",
              color: "#fff", border: "none", borderRadius: "50%",
              width: 36, height: 36, fontSize: 20,
              cursor: "pointer", lineHeight: 1,
            }}
          >×</button>
          <img
            src={photos[lightbox]}
            alt=""
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }}
          />
          {photos.length > 1 && (
            <>
              {lightbox > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
                  aria-label="Foto precedente"
                  style={navBtn("left")}
                >‹</button>
              )}
              {lightbox < photos.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
                  aria-label="Foto successiva"
                  style={navBtn("right")}
                >›</button>
              )}
              <div style={{
                position: "absolute", bottom: 24, left: "50%",
                transform: "translateX(-50%)",
                color: "#fff", fontSize: 13, opacity: 0.7,
              }}>
                {lightbox + 1} / {photos.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function navBtn(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    [side]: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,.15)",
    color: "#fff", border: "none", borderRadius: "50%",
    width: 44, height: 44, fontSize: 28,
    cursor: "pointer", lineHeight: 1,
  } as React.CSSProperties;
}

function SinglePolaroid({ src, caption }: { src: string; caption?: string | null }) {
  return (
    <div style={{ marginBottom: 20, textAlign: "center" }}>
      <div style={{
        display: "inline-block",
        padding: 10,
        background: ROSE,
        border: "10px solid #fff",
        boxShadow: "0 12px 30px rgba(0,0,0,.18)",
        transform: "rotate(-3deg)",
        position: "relative",
      }}>
        <img
          src={src}
          alt=""
          style={{ display: "block", width: "min(280px, 80vw)", height: "min(280px, 80vw)", objectFit: "cover" }}
        />
        <div style={{
          position: "absolute", top: -10, left: "50%",
          transform: "translateX(-50%) rotate(-5deg)",
          width: 70, height: 18,
          background: BORDER,
          boxShadow: "0 1px 2px rgba(0,0,0,.1)",
        }}/>
      </div>
      {caption && (
        <p style={{
          marginTop: 18,
          fontFamily: "Georgia, serif", fontStyle: "italic",
          fontSize: 15, color: "#3d3d3d", lineHeight: 1.5,
          maxWidth: 380, margin: "18px auto 0",
        }}>
          &ldquo;{caption}&rdquo;
        </p>
      )}
    </div>
  );
}
