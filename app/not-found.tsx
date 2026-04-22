/**
 * Fallback 404 globale. Copy neutra — la route /gift/[id]/not-found.tsx
 * (se creata) sovrascriverebbe per pagine gift-specifiche con copy
 * più calda tipo "Regalo non trovato".
 */
export default function NotFound() {
  return (
    <main style={{ minHeight:"100vh", background:"#f7f5f2", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", fontFamily:"system-ui,sans-serif", padding:24 }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🎁</div>
      <h1 style={{ fontSize:28, fontWeight:800, color:"#1a1a1a", margin:"0 0 10px" }}>Pagina non trovata</h1>
      <p style={{ color:"#888", lineHeight:1.6, maxWidth:340, marginBottom:28 }}>
        La pagina che cerchi non esiste o non è più disponibile.<br/>
        Se stavi aprendo un regalo, il link potrebbe essere scaduto.
      </p>
      <a href="/" style={{ background:"#D4537E", color:"#fff", borderRadius:40, padding:"14px 32px", fontSize:14, fontWeight:700, textDecoration:"none" }}>
        Torna alla home
      </a>
    </main>
  );
}
