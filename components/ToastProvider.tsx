"use client";

/**
 * Toast system minimal — sostituisce alert() e confirm() nativi.
 *
 * Uso (client component qualsiasi):
 *   import { useToast } from "@/components/ToastProvider";
 *   const toast = useToast();
 *   toast.success("Bozza eliminata");
 *   toast.error("Impossibile completare");
 *   toast.info("Caricamento in corso…");
 *
 * Pattern:
 *   - ToastProvider wrap layout.tsx (gia' fatto)
 *   - Hook useToast() ritorna { success, error, info }
 *   - Toast stack bottom-right desktop, bottom-center mobile
 *   - Auto-dismiss dopo 4s, hover sospende, click chiude
 *
 * Design tokens: usa CSS vars da globals.css.
 *
 * NON sostituisce confirm() (richiede risposta sincrona). Per
 * conferme distruttive (delete bozza, ecc.) restiamo su window.confirm()
 * fino a quando non implementeremo un Modal system dedicato.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  show: (kind: ToastKind, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const show = useCallback((kind: ToastKind, message: string) => {
    const id = `t${counter.current++}_${Date.now()}`;
    setToasts((prev) => [...prev, { id, kind, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value: ToastContextValue = {
    show,
    success: (m) => show("success", m),
    error: (m) => show("error", m),
    info: (m) => show("info", m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container — bottom-right desktop, bottom-center mobile */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          left: "auto",
          zIndex: 200,
          display: "flex",
          flexDirection: "column-reverse",
          gap: 10,
          maxWidth: "calc(100vw - 32px)",
          pointerEvents: "none",
        }}
        className="toast-container"
      >
        <style>{`
          @media (max-width: 520px) {
            .toast-container {
              right: 16px !important;
              left: 16px !important;
              bottom: 100px !important;
              align-items: center !important;
            }
          }
        `}</style>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback se ToastProvider non e' montato — log + window.alert
    // come graceful degradation. Cosi' non rompiamo niente.
    return {
      show: (_k: ToastKind, m: string) => window.alert(m),
      success: (m: string) => window.alert(`✓ ${m}`),
      error: (m: string) => window.alert(`✗ ${m}`),
      info: (m: string) => window.alert(m),
    };
  }
  return ctx;
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    if (hovered) return; // pausa countdown su hover
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [hovered, onDismiss]);

  const accent =
    toast.kind === "success"
      ? "var(--color-ok)"
      : toast.kind === "error"
      ? "var(--color-err)"
      : "var(--color-accent)";
  const bg =
    toast.kind === "success"
      ? "var(--color-ok-soft)"
      : toast.kind === "error"
      ? "var(--color-err-soft)"
      : "var(--color-accent-soft)";
  const emoji =
    toast.kind === "success" ? "✓" : toast.kind === "error" ? "!" : "i";

  return (
    <div
      role="status"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onDismiss}
      style={{
        background: bg,
        color: "var(--color-ink)",
        border: `1px solid ${accent}`,
        borderRadius: "var(--radius-md)",
        padding: "12px 16px",
        fontSize: "var(--text-sm)",
        lineHeight: "var(--leading-snug)",
        minWidth: 220,
        maxWidth: 380,
        boxShadow: "var(--shadow-lg)",
        cursor: "pointer",
        pointerEvents: "auto",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        animation: "toastSlide 220ms ease both",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <span
        aria-hidden
        style={{
          background: accent,
          color: "#fff",
          width: 22,
          height: 22,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {emoji}
      </span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <style>{`
        @keyframes toastSlide {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
