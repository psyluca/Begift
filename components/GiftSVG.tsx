"use client";

export type GiftTheme = "standard" | "easter" | "graduation" | "birthday" | "kawaii";

function adj(hex: string, amt: number): string {
  try {
    const n = parseInt(hex.replace("#", ""), 16);
    const c = (v: number) => Math.min(255, Math.max(0, v + Math.round(255 * amt)));
    const r = c(n >> 16), g = c((n >> 8) & 255), b = c(n & 255);
    return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
  } catch { return hex; }
}

function BowSVG({ type, color, cx, cy, size: s }: { type: string; color: string; cx: number; cy: number; size: number }) {
  const hl = adj(color, 0.26), dk = adj(color, -0.22);
  const T = `translate(${cx},${cy})`;
  if (type === "star") return (
    <g transform={T}>
      {[0,30,60,90,120,150].map(a => <ellipse key={a} rx={s*.68} ry={s*.19} fill={color} transform={`rotate(${a})`} opacity=".88"/>)}
      <circle r={s*.22} fill={hl}/>
    </g>
  );
  if (type === "rosette") return (
    <g transform={T}>
      {Array.from({length:10},(_,i) => <ellipse key={i} rx={s*.58} ry={s*.16} fill={color} cx={s*.2} transform={`rotate(${i*36})`} opacity=".85"/>)}
      <circle r={s*.23} fill={hl}/>
    </g>
  );
  if (type === "simple") return (
    <g transform={T}>
      <circle r={s*.38} fill="none" stroke={color} strokeWidth={s*.26}/>
      <circle r={s*.14} fill={hl}/>
    </g>
  );
  if (type === "pompom") return (
    <g transform={T}>
      {Array.from({length:12},(_,i) => { const a=(i/12)*Math.PI*2; return <circle key={i} cx={Math.cos(a)*s*.44} cy={Math.sin(a)*s*.44} r={s*.18} fill={i%2?color:dk} opacity=".88"/>; })}
      <circle r={s*.22} fill={hl}/>
    </g>
  );
  // classic
  return (
    <g transform={T}>
      <ellipse rx={s*.75} ry={s*.30} fill={color} transform="rotate(-35)" opacity=".92"/>
      <ellipse rx={s*.48} ry={s*.14} fill={dk} transform="rotate(-35)" opacity=".55"/>
      <ellipse rx={s*.75} ry={s*.30} fill={color} transform="rotate(35)" opacity=".92"/>
      <ellipse rx={s*.48} ry={s*.14} fill={dk} transform="rotate(35)" opacity=".55"/>
      <ellipse rx={s*.21} ry={s*.40} fill={dk} transform="translate(0,5) rotate(-10)" opacity=".75"/>
      <ellipse rx={s*.21} ry={s*.40} fill={dk} transform="translate(0,5) rotate(12)" opacity=".75"/>
      <ellipse rx={s*.27} ry={s*.21} fill={hl}/>
    </g>
  );
}

// ── Standard box ──────────────────────────────────────────────────────────────
function StandardGift({ paper, ribbon, bow, bowType, lidY, animated }: {
  paper: string; ribbon: string; bow: string; bowType: string; lidY: number; animated: boolean;
}) {
  const Pd=adj(paper,-0.16), Pdd=adj(paper,-0.26), Pl=adj(paper,0.10);
  const Rd=adj(ribbon,-0.18), Rl=adj(ribbon,0.14);
  return (
    <g>
      <ellipse cx="100" cy="196" rx="62" ry="9" fill="#00000018"/>
      <g className={animated?"gf":""}>
        <rect x="30" y="100" width="140" height="90" rx="6" fill={paper}/>
        <rect x="154" y="100" width="16" height="90" fill={Pd}/>
        <rect x="38" y="108" width="30" height="7" rx="3" fill={Pl} opacity="0.5"/>
        <rect x="90" y="100" width="20" height="90" fill={ribbon}/>
        <rect x="90" y="100" width="8" height="90" fill={Rl} opacity="0.6"/>
        <rect x="30" y="136" width="140" height="18" fill={ribbon}/>
        <rect x="30" y="136" width="140" height="7" fill={Rl} opacity="0.6"/>
        <rect x="30" y="100" width="140" height="90" rx="6" fill="none" stroke="#00000010" strokeWidth="1"/>
        <rect x="24" y={lidY} width="152" height="26" rx="5" fill={Pdd}/>
        <rect x="32" y={lidY+5} width="28" height="6" rx="3" fill={Pl} opacity="0.4"/>
        <rect x="90" y={lidY} width="20" height="26" fill={Rd}/>
        <rect x="90" y={lidY} width="8" height="26" fill={Rl} opacity="0.5"/>
        <rect x="24" y={lidY+8} width="152" height="10" fill={Rd}/>
        <rect x="24" y={lidY} width="152" height="26" rx="5" fill="none" stroke="#00000012" strokeWidth="1"/>
      </g>
      <g className={animated?"bp":""} transform={`translate(0,${lidY-82})`}>
        <BowSVG type={bowType} color={bow} cx={100} cy={72} size={28}/>
      </g>
    </g>
  );
}

// ── Easter egg ────────────────────────────────────────────────────────────────
function EasterEgg({ paper, ribbon, bow, bowType, lidY, animated }: {
  paper: string; ribbon: string; bow: string; bowType: string; lidY: number; animated: boolean;
}) {
  const Pl = adj(paper, 0.14), Pd = adj(paper, -0.18);
  const stripeOpen = lidY < 60; // egg "open" when lid lifted enough
  const eggTop = 30, eggCx = 100, eggRx = 58, eggRyTop = 75, eggRyBot = 85;

  return (
    <g>
      <ellipse cx="100" cy="200" rx="55" ry="8" fill="#00000015"/>
      <g className={animated?"gf":""}>
        {/* Egg body bottom half */}
        <path d={`M${eggCx-eggRx},130 Q${eggCx-eggRx},${130+eggRyBot} ${eggCx},${130+eggRyBot} Q${eggCx+eggRx},${130+eggRyBot} ${eggCx+eggRx},130 Z`}
          fill={paper}/>
        {/* Decorative stripes */}
        <path d={`M${eggCx-eggRx+4},145 Q${eggCx},138 ${eggCx+eggRx-4},145`}
          fill="none" stroke={ribbon} strokeWidth="5" opacity="0.8"/>
        <path d={`M${eggCx-eggRx+8},162 Q${eggCx},155 ${eggCx+eggRx-8},162`}
          fill="none" stroke={bow} strokeWidth="4" opacity="0.7"/>
        <path d={`M${eggCx-eggRx+12},178 Q${eggCx},172 ${eggCx+eggRx-12},178`}
          fill="none" stroke={ribbon} strokeWidth="3.5" opacity="0.6"/>
        {/* Dots pattern */}
        <circle cx="72" cy="155" r="5" fill={adj(ribbon,0.2)} opacity="0.7"/>
        <circle cx="128" cy="155" r="5" fill={adj(ribbon,0.2)} opacity="0.7"/>
        <circle cx="60" cy="175" r="4" fill={adj(bow,0.15)} opacity="0.6"/>
        <circle cx="140" cy="175" r="4" fill={adj(bow,0.15)} opacity="0.6"/>
        <circle cx="100" cy="190" r="4" fill={adj(ribbon,0.2)} opacity="0.5"/>
        {/* Shine */}
        <ellipse cx="78" cy="142" rx="12" ry="6" fill={Pl} opacity="0.35" transform="rotate(-20,78,142)"/>
      </g>

      {/* Egg lid (top half) - moves up */}
      <g transform={`translate(0,${lidY-82})`} className={animated?"bp":""}>
        <path d={`M${eggCx-eggRx},130 Q${eggCx-eggRx},${130-eggRyTop} ${eggCx},${eggTop} Q${eggCx+eggRx},${130-eggRyTop} ${eggCx+eggRx},130 Z`}
          fill={Pd}/>
        {/* Lid stripe */}
        <path d={`M${eggCx-eggRx+4},115 Q${eggCx},108 ${eggCx+eggRx-4},115`}
          fill="none" stroke={ribbon} strokeWidth="5" opacity="0.7"/>
        <path d={`M${eggCx-eggRx+10},100 Q${eggCx},93 ${eggCx+eggRx-10},100`}
          fill="none" stroke={bow} strokeWidth="3.5" opacity="0.6"/>
        {/* Lid shine */}
        <ellipse cx="78" cy="95" rx="10" ry="5" fill={Pl} opacity="0.3" transform="rotate(-15,78,95)"/>
        {/* Bow on top of egg */}
        <BowSVG type={bowType} color={bow} cx={100} cy={72} size={26}/>
      </g>
    </g>
  );
}

// ── Graduation box ────────────────────────────────────────────────────────────
function GraduationBox({ paper, ribbon, bow, bowType, lidY, animated }: {
  paper: string; ribbon: string; bow: string; bowType: string; lidY: number; animated: boolean;
}) {
  const Pd=adj(paper,-0.18), Pdd=adj(paper,-0.28), Pl=adj(paper,0.12);
  const Rd=adj(ribbon,-0.18), Rl=adj(ribbon,0.14);
  return (
    <g>
      <ellipse cx="100" cy="196" rx="62" ry="9" fill="#00000018"/>
      <g className={animated?"gf":""}>
        {/* Box body */}
        <rect x="28" y="98" width="144" height="92" rx="6" fill={paper}/>
        <rect x="152" y="98" width="20" height="92" fill={Pd}/>
        {/* Star decorations */}
        <polygon points="50,115 52,122 59,122 53,127 55,134 50,129 45,134 47,127 41,122 48,122" fill={adj(ribbon,0.3)} opacity="0.6"/>
        <polygon points="150,140 152,147 159,147 153,152 155,159 150,154 145,159 147,152 141,147 148,147" fill={adj(ribbon,0.3)} opacity="0.5"/>
        {/* Ribbon vertical */}
        <rect x="90" y="98" width="20" height="92" fill={ribbon}/>
        <rect x="92" y="98" width="7" height="92" fill={Rl} opacity="0.5"/>
        {/* Ribbon horizontal */}
        <rect x="28" y="134" width="144" height="18" fill={ribbon}/>
        <rect x="28" y="134" width="144" height="6" fill={Rl} opacity="0.5"/>
        {/* Box border */}
        <rect x="28" y="98" width="144" height="92" rx="6" fill="none" stroke="#00000010" strokeWidth="1"/>
        {/* Lid */}
        <rect x="22" y={lidY} width="156" height="28" rx="5" fill={Pdd}/>
        <rect x="90" y={lidY} width="20" height="28" fill={Rd}/>
        <rect x="22" y={lidY+9} width="156" height="11" fill={Rd}/>
        <rect x="22" y={lidY} width="156" height="28" rx="5" fill="none" stroke="#00000012" strokeWidth="1"/>
      </g>
      {/* Graduation cap on top */}
      <g transform={`translate(0,${lidY-82})`} className={animated?"bp":""}>
        {/* Cap board */}
        <rect x="68" y="62" width="64" height="9" rx="1.5" fill="#1a1a1a"/>
        <polygon points="100,48 130,62 100,70 70,62" fill="#1a1a1a"/>
        <ellipse cx="100" cy="62" rx="30" ry="5" fill="#2d2d2d"/>
        {/* Tassel */}
        <line x1="130" y1="62" x2="138" y2="76" stroke={ribbon} strokeWidth="2.5"/>
        <circle cx="138" cy="79" r="4" fill={ribbon}/>
        {/* Bow underneath cap */}
        <BowSVG type={bowType} color={bow} cx={100} cy={86} size={22}/>
      </g>
    </g>
  );
}

// ── Birthday box ──────────────────────────────────────────────────────────────
function BirthdayBox({ paper, ribbon, bow, bowType, lidY, animated }: {
  paper: string; ribbon: string; bow: string; bowType: string; lidY: number; animated: boolean;
}) {
  const Pd=adj(paper,-0.16), Pdd=adj(paper,-0.26), Pl=adj(paper,0.12);
  const Rd=adj(ribbon,-0.18), Rl=adj(ribbon,0.14);
  const candleColors = [adj(ribbon,0.3), adj(bow,0.2), adj(paper,0.3)];
  return (
    <g>
      <ellipse cx="100" cy="196" rx="62" ry="9" fill="#00000018"/>
      <g className={animated?"gf":""}>
        {/* Box */}
        <rect x="28" y="100" width="144" height="90" rx="6" fill={paper}/>
        <rect x="152" y="100" width="20" height="90" fill={Pd}/>
        {/* Confetti pattern */}
        <rect x="40" y="112" width="9" height="4" rx="1" fill={adj(ribbon,0.3)} transform="rotate(20,44,114)" opacity="0.7"/>
        <rect x="90" y="108" width="7" height="3" rx="1" fill={adj(bow,0.2)} transform="rotate(-15,93,109)" opacity="0.6"/>
        <rect x="122" y="116" width="8" height="3" rx="1" fill={adj(paper,-0.1)} transform="rotate(35,126,117)" opacity="0.65"/>
        <rect x="50" y="148" width="7" height="3" rx="1" fill={adj(bow,0.25)} transform="rotate(-25,53,149)" opacity="0.6"/>
        <rect x="108" y="152" width="9" height="4" rx="1" fill={adj(ribbon,0.25)} transform="rotate(15,112,154)" opacity="0.65"/>
        <rect x="38" y="164" width="8" height="3" rx="1" fill={adj(paper,-0.05)} transform="rotate(40,42,165)" opacity="0.55"/>
        <circle cx="75" cy="130" r="4" fill={adj(ribbon,0.35)} opacity="0.6"/>
        <circle cx="135" cy="125" r="3" fill={adj(bow,0.3)} opacity="0.55"/>
        <circle cx="60" cy="160" r="3.5" fill={adj(paper,-0.08)} opacity="0.6"/>
        <circle cx="128" cy="158" r="3" fill={adj(ribbon,0.3)} opacity="0.55"/>
        {/* Ribbon */}
        <rect x="90" y="100" width="20" height="90" fill={ribbon}/>
        <rect x="92" y="100" width="7" height="90" fill={Rl} opacity="0.5"/>
        <rect x="28" y="136" width="144" height="17" fill={ribbon}/>
        <rect x="28" y="136" width="144" height="6" fill={Rl} opacity="0.5"/>
        <rect x="28" y="100" width="144" height="90" rx="6" fill="none" stroke="#00000010" strokeWidth="1"/>
        {/* Lid */}
        <rect x="22" y={lidY} width="156" height="27" rx="5" fill={Pdd}/>
        <rect x="90" y={lidY} width="20" height="27" fill={Rd}/>
        <rect x="22" y={lidY+9} width="156" height="10" fill={Rd}/>
        <rect x="22" y={lidY} width="156" height="27" rx="5" fill="none" stroke="#00000012" strokeWidth="1"/>
      </g>
      {/* Candles on top */}
      <g transform={`translate(0,${lidY-82})`} className={animated?"bp":""}>
        {/* 3 candles */}
        {[{x:72,h:20,c:0},{x:97,h:25,c:1},{x:122,h:22,c:2}].map((cv,i)=>(
          <g key={i}>
            <rect x={cv.x} y={65-cv.h} width="7" height={cv.h} rx="3" fill={candleColors[cv.c]}/>
            <ellipse cx={cv.x+3.5} cy={63-cv.h} rx="3.5" ry="5" fill="#E8C84A"/>
            <ellipse cx={cv.x+3.5} cy={61-cv.h} rx="1.5" ry="2" fill="#fff" opacity="0.7"/>
          </g>
        ))}
        {/* Pompom bow */}
        <BowSVG type={bowType} color={bow} cx={100} cy={82} size={24}/>
      </g>
    </g>
  );
}

// ── Kawaii box ───────────────────────────────────────────────────────────────
function KawaiiGift({ paper, ribbon, bow, bowType, lidY, animated }: {
  paper: string; ribbon: string; bow: string; bowType: string; lidY: number; animated: boolean;
}) {
  const Pd=adj(paper,-0.10), Pdd=adj(paper,-0.16), Pl=adj(paper,0.14);
  const Rd=adj(ribbon,-0.12), Rl=adj(ribbon,0.18);
  const cheek = "#FFB5C5";
  return (
    <g>
      {/* Shadow */}
      <ellipse cx="100" cy="198" rx="58" ry="8" fill="#00000010"/>

      {/* Floating sparkles */}
      <g className={animated?"kSp":""}>
        {/* Star top-left */}
        <g transform="translate(18,42)">
          <polygon points="0,-7 2,-2 7,-2 3,1 5,7 0,3 -5,7 -3,1 -7,-2 -2,-2" fill="#FFD700" opacity="0.7"/>
        </g>
        {/* Star top-right */}
        <g transform="translate(178,55)">
          <polygon points="0,-5 1.5,-1.5 5,-1.5 2,0.7 3.5,5 0,2.3 -3.5,5 -2,0.7 -5,-1.5 -1.5,-1.5" fill="#FFD700" opacity="0.6"/>
        </g>
        {/* Heart left */}
        <g transform="translate(14,120)">
          <path d="M0,-4 C-2,-8 -8,-8 -8,-3 C-8,2 0,7 0,7 C0,7 8,2 8,-3 C8,-8 2,-8 0,-4Z" fill="#FF8FAB" opacity="0.5" transform="scale(0.6)"/>
        </g>
        {/* Heart right */}
        <g transform="translate(186,108)">
          <path d="M0,-4 C-2,-8 -8,-8 -8,-3 C-8,2 0,7 0,7 C0,7 8,2 8,-3 C8,-8 2,-8 0,-4Z" fill="#FF8FAB" opacity="0.5" transform="scale(0.55)"/>
        </g>
        {/* Small star mid-left */}
        <g transform="translate(22,165)">
          <polygon points="0,-4 1,-1 4,-1 1.5,0.5 2.5,4 0,2 -2.5,4 -1.5,0.5 -4,-1 -1,-1" fill="#B8A9FF" opacity="0.5"/>
        </g>
        {/* Cloud top */}
        <g transform="translate(152,28)" opacity="0.3">
          <ellipse cx="0" cy="0" rx="10" ry="6" fill="#fff"/>
          <ellipse cx="-7" cy="2" rx="6" ry="5" fill="#fff"/>
          <ellipse cx="7" cy="2" rx="7" ry="5" fill="#fff"/>
        </g>
      </g>

      <g className={animated?"gf":""}>
        {/* Box body — extra rounded */}
        <rect x="32" y="100" width="136" height="88" rx="14" fill={paper}/>
        <rect x="32" y="100" width="136" height="88" rx="14" fill="url(#kawaiiShine)" opacity="0.3"/>
        {/* Side shade */}
        <path d="M152,114 L168,114 L168,174 Q168,188 154,188 L152,188 Z" fill={Pd} opacity="0.5"/>
        {/* Cute pattern — polka dots */}
        <circle cx="52" cy="120" r="4" fill={Pl} opacity="0.4"/>
        <circle cx="72" cy="135" r="3" fill={Pl} opacity="0.35"/>
        <circle cx="55" cy="155" r="3.5" fill={Pl} opacity="0.3"/>
        <circle cx="130" cy="118" r="3.5" fill={Pl} opacity="0.35"/>
        <circle cx="148" cy="140" r="3" fill={Pl} opacity="0.3"/>
        <circle cx="135" cy="165" r="4" fill={Pl} opacity="0.3"/>
        <circle cx="85" cy="170" r="3" fill={Pl} opacity="0.35"/>
        {/* Ribbon vertical */}
        <rect x="88" y="100" width="24" height="88" rx="2" fill={ribbon}/>
        <rect x="88" y="100" width="10" height="88" rx="2" fill={Rl} opacity="0.5"/>
        {/* Ribbon horizontal */}
        <rect x="32" y="134" width="136" height="20" rx="2" fill={ribbon}/>
        <rect x="32" y="134" width="136" height="8" rx="2" fill={Rl} opacity="0.5"/>
        {/* Kawaii face on box */}
        <g transform="translate(100,154)">
          {/* Eyes */}
          <ellipse cx="-18" cy="-4" rx="4" ry="4.5" fill="#3a3a3a"/>
          <ellipse cx="18" cy="-4" rx="4" ry="4.5" fill="#3a3a3a"/>
          {/* Eye sparkle */}
          <circle cx="-16.5" cy="-5.5" r="1.5" fill="#fff"/>
          <circle cx="19.5" cy="-5.5" r="1.5" fill="#fff"/>
          {/* Blush cheeks */}
          <ellipse cx="-28" cy="4" rx="7" ry="4" fill={cheek} opacity="0.45"/>
          <ellipse cx="28" cy="4" rx="7" ry="4" fill={cheek} opacity="0.45"/>
          {/* Cute smile */}
          <path d="M-10,5 Q0,14 10,5" fill="none" stroke="#3a3a3a" strokeWidth="2" strokeLinecap="round"/>
        </g>
        {/* Box border */}
        <rect x="32" y="100" width="136" height="88" rx="14" fill="none" stroke="#00000008" strokeWidth="1"/>

        {/* Lid — rounded with kawaii style */}
        <rect x="26" y={lidY} width="148" height="28" rx="10" fill={Pdd}/>
        <rect x="26" y={lidY} width="148" height="28" rx="10" fill="url(#kawaiiShine)" opacity="0.2"/>
        <rect x="88" y={lidY} width="24" height="28" rx="2" fill={Rd}/>
        <rect x="88" y={lidY} width="10" height="28" rx="2" fill={Rl} opacity="0.4"/>
        <rect x="26" y={lidY+9} width="148" height="11" rx="2" fill={Rd}/>
        <rect x="26" y={lidY} width="148" height="28" rx="10" fill="none" stroke="#00000008" strokeWidth="1"/>
      </g>

      {/* Bow + decorations on top */}
      <g className={animated?"bp":""} transform={`translate(0,${lidY-82})`}>
        <BowSVG type={bowType} color={bow} cx={100} cy={72} size={26}/>
        {/* Tiny hearts around bow */}
        <g transform="translate(72,62)" opacity="0.6">
          <path d="M0,-2.5 C-1.2,-5 -5,-5 -5,-2 C-5,1 0,4 0,4 C0,4 5,1 5,-2 C5,-5 1.2,-5 0,-2.5Z" fill={cheek} transform="scale(0.5)"/>
        </g>
        <g transform="translate(130,65)" opacity="0.6">
          <path d="M0,-2.5 C-1.2,-5 -5,-5 -5,-2 C-5,1 0,4 0,4 C0,4 5,1 5,-2 C5,-5 1.2,-5 0,-2.5Z" fill={cheek} transform="scale(0.5)"/>
        </g>
      </g>
    </g>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function GiftSVG({
  paper = "#D85A5A",
  ribbon = "#E8C84A",
  bow,
  bowType = "classic",
  lidY = 82,
  animated = false,
  theme = "standard",
}: {
  paper?: string;
  ribbon?: string;
  bow?: string;
  bowType?: string;
  lidY?: number;
  animated?: boolean;
  theme?: GiftTheme;
}) {
  const bw = bow || ribbon;

  const animStyles = animated ? `
    @keyframes gF{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
    @keyframes bP{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
    @keyframes kSparkle{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.1)}}
    .gf{animation:gF 3s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}
    .bp{animation:bP 2s 0.4s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}
    .kSp{animation:kSparkle 2.5s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}
  ` : "";

  const props = { paper, ribbon, bow: bw, bowType, lidY, animated };

  return (
    <svg viewBox="0 0 200 220" style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}>
      <defs>
        <style>{animStyles}</style>
        <linearGradient id="kawaiiShine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {theme === "easter"     && <EasterEgg      {...props}/>}
      {theme === "graduation" && <GraduationBox  {...props}/>}
      {theme === "birthday"   && <BirthdayBox    {...props}/>}
      {theme === "kawaii"     && <KawaiiGift     {...props}/>}
      {(theme === "standard" || !theme) && <StandardGift {...props}/>}
    </svg>
  );
}
