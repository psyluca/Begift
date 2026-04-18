"use client";
import { useEffect, useState } from "react";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888", LIGHT = "#f7f5f2";

export default function InstallPage() {
  const [os, setOs] = useState<"ios"|"android"|"desktop"|null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) setOs("ios");
    else if (/Android/.test(ua)) setOs("android");
    else setOs("desktop");
  }, []);

  return (
    <main style={{ minHeight:"100vh", background:LIGHT, fontFamily:"system-ui,sans-serif", paddingBottom:80 }}>
      <div style={{ maxWidth:480, margin:"0 auto", padding:"32px 24px" }}>
        <a href="/" style={{ fontSize:13, color:MUTED, textDecoration:"none", display:"block", marginBottom:24 }}>← Torna alla home</a>

        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:64, marginBottom:12 }}>📲</div>
          <h1 style={{ fontSize:26, fontWeight:800, color:DEEP, margin:"0 0 8px" }}>
            Installa Be<span style={{color:ACCENT}}>Gift</span>
          </h1>
          <p style={{ fontSize:15, color:MUTED, lineHeight:1.6 }}>
            Aggiungi BeGift alla schermata home per aprire i regali in un click, senza browser.
          </p>
        </div>

        {/* Tab selector */}
        <div style={{ display:"flex", background:"#fff", borderRadius:16, padding:4, marginBottom:24, boxShadow:"0 2px 12px #0000000a" }}>
          {(["ios","android","desktop"] as const).map(t => (
            <button key={t} onClick={() => setOs(t)} style={{
              flex:1, padding:"10px 8px", border:"none", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer",
              background: os === t ? ACCENT : "transparent",
              color: os === t ? "#fff" : MUTED,
              transition:"all .2s"
            }}>
              {t === "ios" ? "🍎 iPhone" : t === "android" ? "🤖 Android" : "💻 Desktop"}
            </button>
          ))}
        </div>

        {/* iOS */}
        {os === "ios" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { n:1, icon:"🌐", text:'Apri Safari e vai su begift.app' },
              { n:2, icon:"⬆️", text:'Tocca il pulsante Condividi in basso (il quadrato con la freccia)' },
              { n:3, icon:"➕", text:'Scorri e tocca "Aggiungi a schermata Home"' },
              { n:4, icon:"✅", text:'Tocca "Aggiungi" in alto a destra' },
            ].map(s => (
              <div key={s.n} style={{ background:"#fff", borderRadius:16, padding:"16px", display:"flex", gap:14, alignItems:"center", boxShadow:"0 2px 8px #0000000a" }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"#fff5f8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{s.icon}</div>
                <div>
                  <span style={{ fontSize:11, fontWeight:700, color:ACCENT }}>PASSO {s.n}</span>
                  <p style={{ margin:"2px 0 0", fontSize:14, color:DEEP, lineHeight:1.5 }}>{s.text}</p>
                </div>
              </div>
            ))}
            <div style={{ background:"#fff8e1", borderRadius:16, padding:"14px 16px", marginTop:4 }}>
              <p style={{ margin:0, fontSize:13, color:"#5d4037" }}>⚠️ Funziona solo con <strong>Safari</strong> — non con Chrome o altri browser.</p>
            </div>
          </div>
        )}

        {/* Android */}
        {os === "android" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { n:1, icon:"🌐", text:'Apri Chrome e vai su begift.app' },
              { n:2, icon:"⋮", text:'Tocca i tre puntini in alto a destra' },
              { n:3, icon:"➕", text:'Tocca "Aggiungi a schermata Home"' },
              { n:4, icon:"✅", text:'Tocca "Aggiungi" per confermare' },
            ].map(s => (
              <div key={s.n} style={{ background:"#fff", borderRadius:16, padding:"16px", display:"flex", gap:14, alignItems:"center", boxShadow:"0 2px 8px #0000000a" }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"#fff5f8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{s.icon}</div>
                <div>
                  <span style={{ fontSize:11, fontWeight:700, color:ACCENT }}>PASSO {s.n}</span>
                  <p style={{ margin:"2px 0 0", fontSize:14, color:DEEP, lineHeight:1.5 }}>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop */}
        {os === "desktop" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { n:1, icon:"🌐", text:'Apri Chrome o Edge e vai su begift.app' },
              { n:2, icon:"💾", text:'Cerca l\'icona di installazione nella barra degli indirizzi (un computer con una freccia)' },
              { n:3, icon:"✅", text:'Clicca "Installa" per confermare' },
            ].map(s => (
              <div key={s.n} style={{ background:"#fff", borderRadius:16, padding:"16px", display:"flex", gap:14, alignItems:"center", boxShadow:"0 2px 8px #0000000a" }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"#fff5f8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{s.icon}</div>
                <div>
                  <span style={{ fontSize:11, fontWeight:700, color:ACCENT }}>PASSO {s.n}</span>
                  <p style={{ margin:"2px 0 0", fontSize:14, color:DEEP, lineHeight:1.5 }}>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <a href="/" style={{ display:"block", textAlign:"center", background:ACCENT, color:"#fff", borderRadius:40, padding:"15px", fontSize:15, fontWeight:700, textDecoration:"none", marginTop:32 }}>
          Apri BeGift →
        </a>
      </div>
    </main>
  );
}
