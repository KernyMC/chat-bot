import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';

// Animación de notificación inicial
function NotificationBell() {
  const frame = useCurrentFrame();

  // La campana aparece y se anima durante los primeros 90 frames (3 segundos)
  if (frame > 90) return null;

  // Fade in
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // Scale pulse
  const scale = interpolate(
    frame,
    [10, 20, 30, 40, 50, 60, 70, 80, 90],
    [1, 1.2, 1, 1.2, 1, 1.2, 1, 1, 0.8],
    {
      extrapolateRight: 'clamp',
      extrapolateLeft: 'clamp',
    }
  );

  // Fade out at the end
  const fadeOut = interpolate(frame, [80, 90], [1, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: opacity * fadeOut,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(91, 33, 182, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Img
          src={staticFile('campana.svg')}
          style={{
            width: 80,
            height: 80,
          }}
        />
      </div>
      {/* Texto de la notificación */}
      <div
        style={{
          position: 'absolute',
          bottom: -60,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ffffff',
          padding: '12px 20px',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          whiteSpace: 'nowrap',
          fontSize: 13,
          fontWeight: 600,
          color: '#5B21B6',
        }}
      >
        🏦 Oportunidad de crédito
      </div>
    </div>
  );
}

// Bot Avatar usando el logo real
function BotAvatar() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: '#EDE9FE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <Img
        src={staticFile('logomipana.png')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scale(1.25)',
          display: 'block',
        }}
      />
    </div>
  );
}

// Recreación del BottomNavBar usando SVGs directos
function DemoBottomNavBar() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#ffffff',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.08)',
        paddingTop: 12,
        paddingBottom: 8,
        paddingLeft: 8,
        paddingRight: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
        }}
      >
        {/* Inicio */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            minWidth: 56,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 512 512"
            fill="none"
            stroke="#6B7280"
            strokeWidth="32"
          >
            <path d="M80 212v236a16 16 0 0016 16h96V328a24 24 0 0124-24h80a24 24 0 0124 24v136h96a16 16 0 0016-16V212" />
            <path d="M480 256L266.89 52c-5-5.28-16.69-5.34-21.78 0L32 256M400 179V64h-48v69" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#6B7280' }}>Inicio</span>
        </div>

        {/* Mi Caja */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            minWidth: 56,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 512 512" fill="#6B7280">
            <path d="M511.1 378.8l-26.7-160c-2.6-15.4-15.9-26.7-31.6-26.7H208v-64h96c8.8 0 16-7.2 16-16V16c0-8.8-7.2-16-16-16H48c-8.8 0-16 7.2-16 16v96c0 8.8 7.2 16 16 16h96v64H59.1c-15.6 0-29 11.3-31.6 26.7L.8 378.7c-.6 3.5-.9 7-.9 10.5V480c0 17.7 14.3 32 32 32h448c17.7 0 32-14.3 32-32v-90.7c.1-3.5-.2-7-.8-10.5zM280 248c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16h-16c-8.8 0-16-7.2-16-16v-16zm-32 64h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16h-16c-8.8 0-16-7.2-16-16v-16c0-8.8 7.2-16 16-16zm-32-80c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16h-16c-8.8 0-16-7.2-16-16v-16c0-8.8 7.2-16 16-16h16zM80 80V48h192v32H80zm40 200h-16c-8.8 0-16-7.2-16-16v-16c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16zm16 64v-16c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16h-16c-8.8 0-16-7.2-16-16zm216 112c0 4.4-3.6 8-8 8H168c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h176c4.4 0 8 3.6 8 8v16zm24-112c0 8.8-7.2 16-16 16h-16c-8.8 0-16-7.2-16-16v-16c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v16zm48-80c0 8.8-7.2 16-16 16h-16c-8.8 0-16-7.2-16-16v-16c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v16z" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#6B7280' }}>Mi Caja</span>
        </div>

        {/* Mi Pana - Active */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: -34,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: '#5B21B6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(91, 33, 182, 0.4)',
            }}
          >
            <Img
              src={staticFile('mipana.svg')}
              style={{
                width: 36,
                height: 36,
                filter: 'brightness(0) saturate(100%) invert(100%)',
              }}
            />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#5B21B6', marginTop: 4 }}>
            Mi Pana
          </span>
        </div>

        {/* Deuna Veci */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            minWidth: 56,
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative' }}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 512 512"
              fill="none"
              stroke="#6B7280"
              strokeWidth="32"
            >
              <path d="M448 448V240h-64V96H128v144H64v208M112 176h288M112 240h288M112 304h288M112 368h288" />
              <path strokeLinecap="round" d="M256 176v-64l32-32" />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: -6,
                right: -16,
                background: '#A7EED9',
                color: '#5B21B6',
                fontSize: 7,
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 4,
              }}
            >
              Nuevo
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', marginTop: 2 }}>
            Deuna Veci
          </span>
        </div>

        {/* Menu */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            minWidth: 56,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B7280"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#6B7280' }}>Menu</span>
        </div>
      </div>

      {/* Home indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <div style={{ width: 120, height: 4, background: '#D1D5DB', borderRadius: 4 }} />
      </div>
    </div>
  );
}

// Mensaje del bot
function BotMessage({ text, startFrame }: { text: string; startFrame: number }) {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame - startFrame,
    [0, 10],
    [0, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  const scale = interpolate(
    frame - startFrame,
    [0, 15],
    [0.9, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  if (frame < startFrame) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        marginBottom: 14,
        opacity,
      }}
    >
      <BotAvatar />
      <div
        style={{
          background: '#F3F4F6',
          color: '#111827',
          padding: '12px 16px',
          borderRadius: '16px 16px 16px 4px',
          maxWidth: '80%',
          fontSize: 15,
          lineHeight: 1.5,
          transform: `scale(${scale})`,
        }}
      >
        {text}
      </div>
    </div>
  );
}

// Opciones de respuesta (botones)
function OptionsMessage({ options, startFrame }: { options: string[]; startFrame: number }) {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame - startFrame,
    [0, 15],
    [0, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  if (frame < startFrame) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        paddingLeft: 48,
        marginBottom: 14,
        opacity,
      }}
    >
      {options.map((option, i) => (
        <div
          key={i}
          style={{
            background: '#ffffff',
            border: '1.5px solid #5B21B6',
            borderRadius: 12,
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 500,
            color: '#5B21B6',
            textAlign: 'left',
          }}
        >
          {option}
        </div>
      ))}
    </div>
  );
}

// Mensaje del usuario
function UserMessage({ text, startFrame }: { text: string; startFrame: number }) {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame - startFrame,
    [0, 5],
    [0, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  if (frame < startFrame) return null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: 14,
        opacity,
      }}
    >
      <div
        style={{
          background: '#5B21B6',
          color: '#ffffff',
          padding: '10px 14px',
          borderRadius: '16px 16px 4px 16px',
          maxWidth: '75%',
          fontSize: 15,
          lineHeight: 1.4,
        }}
      >
        {text}
      </div>
    </div>
  );
}

// Componente principal de la demo del chatbot
export function ChatBotDemo() {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  // Timing configuration (at 30fps)
  const chatStartFrame = 90;

  // Bot mensaje proactivo sobre crédito
  const botCreditStart = chatStartFrame;

  // Opciones aparecen
  const optionsStart = botCreditStart + 120; // 4 segundos después para que lean

  // Usuario elige "Quiero saber más"
  const userChoiceStart = optionsStart + 45; // 1.5 segundos después

  // Bot responde con detalles
  const botDetailsStart = userChoiceStart + 30; // 1 segundo después

  return (
    <AbsoluteFill
      style={{
        background: '#f2f2f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Device shell */}
      <div
        style={{
          width: 390,
          height: 844,
          background: '#ffffff',
          borderRadius: 44,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative',
          paddingBottom: 96,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 20px 16px',
            position: 'relative',
            borderBottom: '1px solid #F3F4F6',
          }}
        >
          <button
            style={{
              position: 'absolute',
              left: 20,
              background: 'none',
              border: 'none',
              padding: 8,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#111827"
              strokeWidth="2.5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#EDE9FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <Img
                src={staticFile('logomipana.png')}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scale(1.15)',
                  display: 'block',
                }}
              />
            </div>
            <span style={{ fontSize: 17, fontWeight: 600, color: '#111827' }}>Mi Pana</span>
          </div>
        </div>

        {/* Chat messages area */}
        <div
          style={{
            flex: 1,
            padding: '20px 16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {/* Mensaje proactivo del bot sobre crédito */}
          <BotMessage
            text="🏦 Mi pana, llevas 16 meses de cobros seguidos con DeUna.

No has pensado en ahorrar un poco cada mes?"
            startFrame={botCreditStart}
          />

          {/* Opciones */}
          <OptionsMessage
            options={['✓ Quiero saber más', '✕ Después']}
            startFrame={optionsStart}
          />

          {/* Usuario elige */}
          <UserMessage
            text="✓ Quiero saber más"
            startFrame={userChoiceStart}
          />

          {/* Respuesta con detalles del crédito */}
          <BotMessage
            text="Perfecto. Con este crédito puedes:

💰 Reabastecer tu inventario completo
💳 Saldar deudas sin tocar lo que tienes en caja
📦 Comprar al por mayor y ahorrar

Y lo mejor: Sin ir a una agencia, sin armar carpetas. Todo desde tu celular en minutos.

¿Quieres que te conecte con Banco Pichincha?"
            startFrame={botDetailsStart}
          />
        </div>

        {/* Input field */}
        <div
          style={{
            flexShrink: 0,
            padding: '12px 20px',
            background: '#ffffff',
            borderTop: '1px solid #F3F4F6',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 24,
              padding: '8px 8px 8px 16px',
            }}
          >
            <div
              style={{
                flex: 1,
                fontSize: 15,
                color: '#6B7280',
                fontWeight: 500,
              }}
            >
              Escribe tu mensaje...
            </div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#D1D5DB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <DemoBottomNavBar />

        {/* Notification Bell - aparece al inicio */}
        <NotificationBell />
      </div>
    </AbsoluteFill>
  );
}
