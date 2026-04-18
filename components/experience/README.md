# Experience v2 — Sandbox

Questa cartella contiene la **nuova esperienza grafica di BeGift in costruzione**.
È completamente isolata dal resto del progetto: nessun componente qui dentro
viene importato da codice in produzione. L'unico punto di consumo è la route
nascosta `/lab`.

## Stato
- **Branch**: `feature/gift-experience-v2`
- **Route di test**: `/lab` (non linkata da nessun menu)
- **Feature flag**: non ancora necessario (isolamento via route)
- **Avvio**: 2026-04-18

## Obiettivo
Costruire un sistema di apertura regalo cinematografica, con due "ambienti"
tematici (Candy e Kawaii) e skin stagionali che si combinano sopra l'ambiente
scelto. Ogni scena è parametrica: legge dati dinamici del regalo
(destinatario, mittente, messaggio, tipo di contenuto, colore accento, canzone)
e li integra nell'animazione.

## Architettura
```
components/experience/
├── themes/          # Sistema di theming (environments + skin + personalizzazione)
│   ├── types.ts            → Tipi TS del theming
│   ├── candy.ts            → Ambiente Candy
│   ├── kawaii.ts           → Ambiente Kawaii
│   ├── ThemeProvider.tsx   → Context React
│   └── useTheme.ts         → Hook
├── boxes/           # Pacchi regalo SVG (uno per ambiente)
├── particles/       # Sistemi di particelle (coriandoli, petali, ecc.)
└── scenes/          # Orchestratori delle mini-scene cinematografiche
    └── GiftOpenScene.tsx   → Apertura regalo (6 beat: attesa → sblocco → burst → emerge → coriandoli → settle)
```

## Principi
1. **Scene parametriche, non filmati fissi**: ogni beat legge props dinamiche.
2. **Strati componibili**: sfondo, pacco, contenuto, particelle, testi, audio sono indipendenti.
3. **Isolamento totale dal codice in produzione** finché non è validato.
4. **Primo target: iPhone PWA**. Performance ≥ 60fps su iPhone recente.
