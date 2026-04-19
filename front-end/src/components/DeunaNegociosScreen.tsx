import { createElement, useState } from "react";
import mipanaOutlineIcon from "../assets/mipanaoutline.svg";
import qrCodeIcon from "../assets/qrcode.svg";

// 25x25 QR-like grid: 1=black, 0=white
const QR_GRID: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1],
  [0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0],
  [1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0],
  [0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0],
  [0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1],
  [1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1],
  [0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
  [1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1],
];

function QRCode() {
  const size = 260;
  const moduleSize = size / 25;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={size} height={size} fill="white" />
        {QR_GRID.map((row, r) =>
          row.map((cell, c) =>
            cell === 1 ? (
              <rect
                key={`${r}-${c}`}
                x={c * moduleSize}
                y={r * moduleSize}
                width={moduleSize}
                height={moduleSize}
                fill="black"
              />
            ) : null,
          ),
        )}
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="bg-white rounded-full flex items-center justify-center shadow"
          style={{ width: 52, height: 52, border: "3px solid white" }}
        >
          <img
            src="/Negocios.svg"
            alt="deuna logo"
            style={{
              width: 40,
              height: 40,
              objectFit: "contain",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function QRFrame({ children }: { children: React.ReactNode }) {
  const bracketSize = 26;
  const bracketThickness = 3;
  const bracketColor = "#A78BCA";

  const corner = (pos: "tl" | "tr" | "bl" | "br") => {
    const base: React.CSSProperties = {
      position: "absolute",
      width: bracketSize,
      height: bracketSize,
      borderColor: bracketColor,
      borderStyle: "solid",
      borderWidth: 0,
    };
    const styles: Record<string, React.CSSProperties> = {
      tl: {
        ...base,
        top: 0,
        left: 0,
        borderTopWidth: bracketThickness,
        borderLeftWidth: bracketThickness,
      },
      tr: {
        ...base,
        top: 0,
        right: 0,
        borderTopWidth: bracketThickness,
        borderRightWidth: bracketThickness,
      },
      bl: {
        ...base,
        bottom: 0,
        left: 0,
        borderBottomWidth: bracketThickness,
        borderLeftWidth: bracketThickness,
      },
      br: {
        ...base,
        bottom: 0,
        right: 0,
        borderBottomWidth: bracketThickness,
        borderRightWidth: bracketThickness,
      },
    };
    return <div style={styles[pos]} />;
  };

  return (
    <div style={{ position: "relative", display: "inline-block", padding: 12 }}>
      {corner("tl")}
      {corner("tr")}
      {corner("bl")}
      {corner("br")}
      {children}
    </div>
  );
}

// Fingerprint Modal Component
function FingerprintModal({
  isOpen,
  onAuthenticate,
}: {
  isOpen: boolean;
  onAuthenticate: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 32,
          padding: 32,
          width: 300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: "#111827",
            textAlign: "center",
          }}
        >
          Autenticación biométrica
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "#6B7280",
            textAlign: "center",
          }}
        >
          Toca el sensor de huella para continuar
        </p>

        {/* Fingerprint button */}
        <button
          onClick={onAuthenticate}
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)",
            border: "3px solid #5B21B6",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.95)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(91, 33, 182, 0.4)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = "scale(0.95)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(91, 33, 182, 0.4)";
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <svg
            width="50"
            height="50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5B21B6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
            <path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2" />
            <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
            <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
            <path d="M8.65 22c.21-.66.45-1.32.57-2" />
            <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
            <path d="M2 16h.01" />
            <path d="M21.8 16c.2-2 .131-5.354 0-6" />
            <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2" />
          </svg>
        </button>

        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "#9CA3AF",
            textAlign: "center",
          }}
        >
          Powered by mipana
        </p>
      </div>
    </div>
  );
}

const COMERCIOS = [
  { id: "COM-001", nombre: "Tienda Don Aurelio", emoji: "🛒" },
  { id: "COM-002", nombre: "Fonda Don Jorge", emoji: "🍽️" },
  { id: "COM-003", nombre: "Salón Belleza Total", emoji: "💇" },
];

function ComercioChevronSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = COMERCIOS.find((c) => c.id === value) ?? COMERCIOS[0];

  return (
    <div style={{ position: "relative", marginBottom: 14 }}>
      {/* Trigger row */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 14px",
          borderRadius: 12,
          border: "1.5px solid #DDD6FE",
          background: "#F5F3FF",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
      >
        <span style={{ fontSize: 18 }}>{selected.emoji}</span>
        <span style={{ flex: 1, textAlign: "left", fontSize: 14, fontWeight: 600, color: "#3B0764" }}>
          {selected.nombre}
        </span>
        {/* Chevron icon — rotates when open */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#5B21B6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            borderRadius: 12,
            border: "1.5px solid #E5E7EB",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          {COMERCIOS.map((c, i) => (
            <button
              key={c.id}
              onClick={() => { onChange(c.id); setOpen(false); }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                background: c.id === value ? "#F5F3FF" : "#ffffff",
                border: "none",
                borderBottom: i < COMERCIOS.length - 1 ? "1px solid #F3F4F6" : "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.1s",
              }}
            >
              <span style={{ fontSize: 18 }}>{c.emoji}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: c.id === value ? 700 : 500, color: c.id === value ? "#5B21B6" : "#111827" }}>
                {c.nombre}
              </span>
              {c.id === value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B21B6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface DeunaNegociosScreenProps {
  onLogin?: (destination?: "home" | "mi-pana", comercioId?: string) => void;
}

export default function DeunaNegociosScreen({
  onLogin,
}: DeunaNegociosScreenProps) {
  const [activeRole, setActiveRole] = useState<"admin" | "vendedor">("admin");
  const [hidden, setHidden] = useState(true);
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);
  const [selectedComercio, setSelectedComercio] = useState("COM-001");

  const handleMipanaClick = () => {
    setShowFingerprintModal(true);
  };

  const handleAuthenticate = () => {
    setShowFingerprintModal(false);
    if (onLogin) {
      onLogin("mi-pana", selectedComercio);
    }
  };

  return (
    <div
      style={{
        background: "#f2f2f7",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Device shell */}
      <div
        style={{
          width: 390,
          height: "100svh",
          maxHeight: 844,
          background: "#ffffff",
          borderRadius: 44,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          position: "relative",
        }}
      >
        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            paddingBottom: 100,
          }}
        >
          {/* Header: logo + badge */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            <img
              src="/Negocios.png"
              alt="deuna Negocios"
              style={{
                height: 80,
                objectFit: "contain",
              }}
            />
          </div>

          {/* QR code */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            <QRFrame>
              <QRCode />
            </QRFrame>
          </div>

          {/* Account info */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: 12,
              gap: 10,
            }}
          >
            <p
              style={{
                color: "#111827",
                fontSize: 15,
                fontWeight: 500,
                textAlign: "center",
                margin: 0,
                paddingLeft: 32,
                paddingRight: 32,
              }}
            >
              Cobra con este QR o Nro de cuenta
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  color: "#9aa0b6",
                  fontSize: 15,
                  fontWeight: 500,
                  opacity: 0.75,
                }}
              >
                Nro. {hidden ? "******7845" : "1234567845"}
              </span>
              <button
                onClick={() => setHidden(!hidden)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 4,
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                {hidden
                  ? createElement("ion-icon", {
                      name: "eye-off",
                      style: { fontSize: 20, color: "#471f7a" },
                    })
                  : createElement("ion-icon", {
                      name: "eye",
                      style: { fontSize: 20, color: "#471f7a" },
                    })}
              </button>
              <button
                style={{
                  background: "none",
                  border: "none",
                  padding: 4,
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                {createElement("ion-icon", {
                  name: "share-social",
                  style: { fontSize: 20, color: "#471f7a" },
                })}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom fixed section */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#ffffff",
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 16,
            paddingBottom: 28,
            borderTop: "1px solid #F3F4F6",
          }}
        >
          {/* Role toggle */}
          <div
            style={{
              background: "#F3F4F6",
              borderRadius: 50,
              padding: 4,
              display: "flex",
              marginBottom: 18,
            }}
          >
            <button
              onClick={() => setActiveRole("admin")}
              style={{
                flex: 1,
                padding: "11px 0",
                borderRadius: 50,
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: activeRole === "admin" ? 700 : 500,
                color: activeRole === "admin" ? "#111827" : "#9CA3AF",
                background: activeRole === "admin" ? "#ffffff" : "transparent",
                boxShadow:
                  activeRole === "admin"
                    ? "0 1px 4px rgba(0,0,0,0.12)"
                    : "none",
                transition: "all 0.2s",
              }}
            >
              Administrador
            </button>
            <button
              onClick={() => setActiveRole("vendedor")}
              style={{
                flex: 1,
                padding: "11px 0",
                borderRadius: 50,
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: activeRole === "vendedor" ? 700 : 500,
                color: activeRole === "vendedor" ? "#111827" : "#9CA3AF",
                background:
                  activeRole === "vendedor" ? "#ffffff" : "transparent",
                boxShadow:
                  activeRole === "vendedor"
                    ? "0 1px 4px rgba(0,0,0,0.12)"
                    : "none",
                transition: "all 0.2s",
              }}
            >
              Vendedor
            </button>
          </div>

          {/* Verificar un cobro */}
          <p
            style={{
              textAlign: "center",
              fontSize: 16,
              fontWeight: 600,
              color: "#111827",
              margin: "0 0 14px 0",
            }}
          >
            Verificar un cobro
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 24,
              marginBottom: 18,
            }}
          >
            {/* WhatsApp */}
            <button
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: "#EDE9FE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#5B21B6">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <span style={{ fontSize: 11, color: "#4B5563", fontWeight: 500 }}>
                Por whatsapp
              </span>
            </button>

            {/* Mipana Chatbot */}
            <button
              onClick={handleMipanaClick}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)",
                  border: "2px solid #5B21B6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.2s",
                }}
              >
                <img
                  src={mipanaOutlineIcon}
                  alt="Mi Pana"
                  style={{
                    width: 28,
                    height: 28,
                    objectFit: "contain",
                    filter:
                      "brightness(0) saturate(100%) invert(19%) sepia(79%) saturate(2659%) hue-rotate(247deg) brightness(90%) contrast(95%) drop-shadow(0.5px 0 0 #5B21B6) drop-shadow(-0.5px 0 0 #5B21B6)",
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: "#5B21B6", fontWeight: 600 }}>
                Mi Pana
              </span>
            </button>

            {/* QR Scan */}
            <button
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: "#EDE9FE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={qrCodeIcon}
                  alt="Escanear QR"
                  style={{
                    width: 26,
                    height: 26,
                    objectFit: "contain",
                    filter:
                      "brightness(0) saturate(100%) invert(19%) sepia(79%) saturate(2659%) hue-rotate(247deg) brightness(90%) contrast(95%)",
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: "#4B5563", fontWeight: 500 }}>
                Escaneando QR
              </span>
            </button>
          </div>

          {/* Selector de comercio — chevron */}
          <ComercioChevronSelector
            value={selectedComercio}
            onChange={setSelectedComercio}
          />

          {/* Ingresar button */}
          <button
            onClick={() => onLogin?.("home", selectedComercio)}
            style={{
              width: "100%",
              background: "#3B0764",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 17,
              padding: "16px 0",
              borderRadius: 16,
              border: "none",
              cursor: "pointer",
              letterSpacing: 0.2,
              transition: "opacity 0.15s",
            }}
            onMouseDown={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseUp={(e) => (e.currentTarget.style.opacity = "1")}
            onTouchStart={(e) => (e.currentTarget.style.opacity = "0.85")}
            onTouchEnd={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Ingresar
          </button>

          {/* Home indicator */}
          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 10 }}
          >
            <div
              style={{
                width: 120,
                height: 4,
                background: "#D1D5DB",
                borderRadius: 4,
              }}
            />
          </div>
        </div>

        {/* Fingerprint Modal */}
        <FingerprintModal
          isOpen={showFingerprintModal}
          onAuthenticate={handleAuthenticate}
        />
      </div>
    </div>
  );
}
