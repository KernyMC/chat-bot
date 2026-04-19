import { useState, useRef, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import BottomNavBar, { type NavTab } from './BottomNavBar'
import logomipanaIcon from '../assets/logomipana.png'
import type { ChatMessage, OpenAIMessage } from '../types/chat'
import {
  callAI,
  callAIWithToolResults,
  AI_PROVIDERS,
  type AIProvider,
  type ToolCallResult,
} from '../services/aiService'
import { sendToBackend, getReportFromBackend, getWelcomeMessage } from '../services/backendService'
import { generateSalesPDF } from '../utils/pdfGenerator'

interface MiPanaScreenProps {
  onBack: () => void
  comercioId?: string
  initialMessage?: string
}

const CHART_COLORS = ['#5B21B6', '#0F766E', '#F59E0B', '#EF4444', '#3B82F6']

const PURPLE_GRADIENT = [
  '#3B0764', '#4C1D95', '#5B21B6', '#6D28D9', '#7C3AED',
  '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE',
]

const QUICK_ACTIONS = [
  { label: '📊 Mis ventas', message: '¿Cómo van mis ventas este mes?' },
  { label: '📅 Reporte semanal', message: 'Dame el reporte de ventas de esta semana' },
  { label: '📈 Reporte mensual', message: 'Dame el reporte mensual de ventas' },
  { label: '📄 Reporte anual PDF', message: 'Genera el reporte anual de ventas en PDF' },
]

function makeId() {
  return Math.random().toString(36).slice(2)
}

function formatTooltipCurrency(value: unknown, label: string): [string, string] {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN
  const safeValue = Number.isFinite(parsed) ? parsed : 0
  return [`$${safeValue.toLocaleString()}`, label]
}

function renderInline(text: string, color: string) {
  // Bold: **text** and markdown links: [label](url)
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i} style={{ color: '#3B0764' }}>{p.slice(2, -2)}</strong>
    }
    const linkMatch = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      return (
        <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
          style={{ color: '#5B21B6', fontWeight: 600, textDecoration: 'underline' }}>
          {linkMatch[1]}
        </a>
      )
    }
    return <span key={i} style={{ color }}>{p}</span>
  })
}

function FormattedText({ text, color = '#111827', size = 15 }: { text: string; color?: string; size?: number }) {
  const lines = text.split('\n').filter((l) => l !== undefined)
  return (
    <div style={{ margin: 0, fontSize: size, color, lineHeight: 1.6 }}>
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} style={{ height: 6 }} />
        const isBullet = /^[-•·]\s/.test(trimmed)
        const isNumbered = /^\d+\.\s/.test(trimmed)
        const content = isBullet ? trimmed.slice(2) : isNumbered ? trimmed.replace(/^\d+\.\s/, '') : trimmed
        return (
          <div key={i} style={{ display: 'flex', gap: isBullet || isNumbered ? 6 : 0, marginBottom: 2 }}>
            {(isBullet || isNumbered) && (
              <span style={{ color: '#5B21B6', fontWeight: 700, flexShrink: 0 }}>
                {isBullet ? '·' : trimmed.match(/^\d+\./)?.[0]}
              </span>
            )}
            <span>{renderInline(content, color)}</span>
          </div>
        )
      })}
    </div>
  )
}

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
      <img
        src={logomipanaIcon}
        alt="Mi Pana"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scale(1.25)',
          display: 'block',
        }}
      />
    </div>
  )
}

export default function MiPanaScreen({ onBack, comercioId = 'COM-001', initialMessage }: MiPanaScreenProps) {
  const [navTab, setNavTab] = useState<NavTab>('mi-pana')
  const [input, setInput] = useState('')
  const [uiMessages, setUiMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      type: 'text',
      timestamp: Date.now(),
      content: '¡Oe, veci! Soy Mi Pana. Un momento...',
    },
  ])
  const [apiHistory, setApiHistory] = useState<OpenAIMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [provider, setProvider] = useState<AIProvider | 'backend'>(() => {
    const env = import.meta.env.VITE_CHAT_PROVIDER as string
    if (env === 'backend' || env === 'openai' || env === 'groq') return env
    return 'deepseek'
  })
  const scrollRef = useRef<HTMLDivElement>(null)

  const initialSentRef = useRef(false)

  useEffect(() => {
    getWelcomeMessage(comercioId).then((msg) => {
      setUiMessages([{ id: 'welcome', role: 'assistant', type: 'text', timestamp: Date.now(), content: msg }])
      if (initialMessage && !initialSentRef.current) {
        initialSentRef.current = true
        setTimeout(() => sendMessage(initialMessage), 300)
      }
    }).catch(() => {
      if (initialMessage && !initialSentRef.current) {
        initialSentRef.current = true
        setTimeout(() => sendMessage(initialMessage), 300)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comercioId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [uiMessages])

  const handleNavChange = (tab: NavTab) => {
    setNavTab(tab)
    if (tab !== 'mi-pana') onBack()
  }

  function _detectReportType(message: string): 'weekly' | 'monthly' | 'annual' | null {
    const lower = message.toLowerCase()
    const isReport =
      lower.includes('pdf') ||
      lower.includes('reporte') ||
      lower.includes('descargar') ||
      lower.includes('exportar')
    if (!isReport) return null
    if (lower.includes('semana') || lower.includes('semanal')) return 'weekly'
    if (lower.includes('anual') || lower.includes('año') || lower.includes('2025')) return 'annual'
    return 'monthly'
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      type: 'text',
      timestamp: Date.now(),
      content: text,
    }

    const loadingMsg: ChatMessage = {
      id: 'loading',
      role: 'assistant',
      type: 'loading',
      timestamp: Date.now(),
      content: '',
    }

    setUiMessages((prev) => [...prev.filter((m) => m.id !== 'loading'), userMsg, loadingMsg])
    setInput('')
    setIsLoading(true)

    if (provider === 'backend') {
      try {
        const reportType = _detectReportType(text)
        const backendRes = reportType
          ? await getReportFromBackend(reportType, comercioId)
          : await sendToBackend(text, comercioId)

        const newMsgs: ChatMessage[] = []

        if (backendRes.pdfData) {
          newMsgs.push({
            id: makeId(),
            role: 'assistant',
            type: 'pdf_ready',
            timestamp: Date.now(),
            content: backendRes.text,
            pdfTitle: backendRes.pdfData.title,
            period: backendRes.pdfData.period,
            tableData: backendRes.pdfData.tableData,
            totalAmount: backendRes.pdfData.totalAmount,
          })
        } else {
          if (backendRes.chart) {
            newMsgs.push({
              id: makeId(),
              role: 'assistant',
              type: 'chart',
              timestamp: Date.now(),
              content: '',
              chartType: backendRes.chart.chartType,
              title: backendRes.chart.title,
              data: backendRes.chart.data,
            })
          }
          newMsgs.push({
            id: makeId(),
            role: 'assistant',
            type: 'text',
            timestamp: Date.now(),
            content: backendRes.text || 'No pude preparar una respuesta.',
          })
          if (backendRes.productoUrl) {
            newMsgs.push({
              id: makeId(),
              role: 'assistant',
              type: 'text',
              timestamp: Date.now(),
              content: `🏦 [Ver condiciones en Banco Pichincha →](${backendRes.productoUrl})`,
            })
          }
        }

        setUiMessages((prev) => [...prev.filter((m) => m.type !== 'loading'), ...newMsgs])
      } catch (err) {
        setUiMessages((prev) => [
          ...prev.filter((m) => m.type !== 'loading'),
          {
            id: makeId(),
            role: 'assistant',
            type: 'text',
            timestamp: Date.now(),
            content: `Hubo un error: ${err instanceof Error ? err.message : 'Error desconocido'}. Intenta de nuevo.`,
          },
        ])
      } finally {
        setIsLoading(false)
      }
      return
    }

    const newHistory: OpenAIMessage[] = [...apiHistory, { role: 'user', content: text }]
    setApiHistory(newHistory)

    try {
      const response = await callAI(provider as AIProvider, newHistory)

      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolResults: ToolCallResult[] = []
        const newUiMsgs: ChatMessage[] = []

        for (const tc of response.toolCalls) {
          const args = JSON.parse(tc.function.arguments)
          let toolResult = ''

          if (tc.function.name === 'show_chart') {
            newUiMsgs.push({
              id: makeId(),
              role: 'assistant',
              type: 'chart',
              timestamp: Date.now(),
              content: args.summary ?? '',
              chartType: args.chart_type,
              title: args.title,
              data: args.data,
            })
            toolResult = 'Gráfica mostrada exitosamente.'
          } else if (tc.function.name === 'ask_clarification') {
            newUiMsgs.push({
              id: makeId(),
              role: 'assistant',
              type: 'multiple_choice',
              timestamp: Date.now(),
              content: args.question,
              options: args.options,
              answered: false,
            })
            toolResult = 'Pregunta mostrada al usuario. Esperando su respuesta.'
          } else if (tc.function.name === 'generate_pdf_report') {
            newUiMsgs.push({
              id: makeId(),
              role: 'assistant',
              type: 'pdf_ready',
              timestamp: Date.now(),
              content: args.summary ?? '',
              pdfTitle: args.title,
              period: args.period,
              tableData: args.table_data,
              totalAmount: args.total_amount,
            })
            toolResult = 'Reporte PDF preparado y listo para descargar.'
          }

          toolResults.push({ tool_call_id: tc.id, name: tc.function.name, result: toolResult })
        }

        const followUp = await callAIWithToolResults(
          provider as AIProvider,
          newHistory,
          response.rawAssistantMessage,
          toolResults
        )

        const updatedHistory: OpenAIMessage[] = [
          ...newHistory,
          response.rawAssistantMessage,
          ...toolResults.map((r) => ({
            role: 'tool' as const,
            content: r.result,
            tool_call_id: r.tool_call_id,
            name: r.name,
          })),
          { role: 'assistant', content: followUp },
        ]
        setApiHistory(updatedHistory)

        setUiMessages((prev) => {
          const withoutLoader = prev.filter((m) => m.type !== 'loading')
          const followUpMsg: ChatMessage | null = followUp
            ? {
                id: makeId(),
                role: 'assistant',
                type: 'text',
                timestamp: Date.now(),
                content: followUp,
              }
            : null
          return [...withoutLoader, ...newUiMsgs, ...(followUpMsg ? [followUpMsg] : [])]
        })
      } else {
        const textContent = response.text ?? 'Lo siento, no pude procesar tu mensaje.'
        setApiHistory([...newHistory, { role: 'assistant', content: textContent }])
        setUiMessages((prev) => [
          ...prev.filter((m) => m.type !== 'loading'),
          {
            id: makeId(),
            role: 'assistant',
            type: 'text',
            timestamp: Date.now(),
            content: textContent,
          },
        ])
      }
    } catch (err) {
      setUiMessages((prev) => [
        ...prev.filter((m) => m.type !== 'loading'),
        {
          id: makeId(),
          role: 'assistant',
          type: 'text',
          timestamp: Date.now(),
          content: `Hubo un error: ${err instanceof Error ? err.message : 'Error desconocido'}. Intenta de nuevo.`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptionSelect = (msgId: string, option: string) => {
    setUiMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.type === 'multiple_choice' ? { ...m, answered: true } : m
      )
    )
    sendMessage(option)
  }

  const renderMessage = (msg: ChatMessage) => {
    if (msg.type === 'loading') {
      return (
        <div key="loading" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <BotAvatar />
          <div
            style={{
              background: '#F3F4F6',
              borderRadius: 16,
              borderTopLeftRadius: 4,
              padding: '14px 18px',
            }}
          >
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#9CA3AF',
                    animation: 'mipana-bounce 1.2s infinite',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (msg.role === 'user') {
      return (
        <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div
            style={{
              background: '#5B21B6',
              borderRadius: 16,
              borderBottomRightRadius: 4,
              padding: '10px 14px',
              maxWidth: '75%',
            }}
          >
            <FormattedText text={msg.content} color="#ffffff" />
          </div>
        </div>
      )
    }

    if (msg.type === 'text') {
      return (
        <div key={msg.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <BotAvatar />
          <div
            style={{
              background: '#F3F4F6',
              borderRadius: 16,
              borderTopLeftRadius: 4,
              padding: '10px 14px',
              maxWidth: '80%',
            }}
          >
            <FormattedText text={msg.content} />
          </div>
        </div>
      )
    }

    if (msg.type === 'chart') {
      return (
        <div key={msg.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <BotAvatar />
          <div
            style={{
              background: '#F3F4F6',
              borderRadius: 16,
              borderTopLeftRadius: 4,
              padding: '12px 14px',
              maxWidth: '90%',
            }}
          >
            <p
              style={{
                margin: '0 0 10px 0',
                fontSize: 13,
                fontWeight: 600,
                color: '#111827',
              }}
            >
              {msg.title}
            </p>

            {msg.chartType === 'bar' ? (
              <ResponsiveContainer width={240} height={150}>
                <BarChart data={msg.data} margin={{ top: 4, right: 4, left: -24, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 8 }} />
                  <Tooltip
                    formatter={(value) => formatTooltipCurrency(value, 'Ventas')}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {msg.data.map((_, i) => (
                      <Cell key={i} fill={PURPLE_GRADIENT[i % PURPLE_GRADIENT.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <PieChart width={250} height={160}>
                <Pie data={msg.data} cx="50%" cy="42%" outerRadius={58} dataKey="value">
                  {msg.data.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatTooltipCurrency(value, '')}
                  contentStyle={{ fontSize: 11 }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            )}

            {msg.content && (
              <p
                style={{ margin: '8px 0 0 0', fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}
              >
                {msg.content}
              </p>
            )}
          </div>
        </div>
      )
    }

    if (msg.type === 'multiple_choice') {
      return (
        <div key={msg.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <BotAvatar />
          <div style={{ maxWidth: '85%' }}>
            <div
              style={{
                background: '#F3F4F6',
                borderRadius: 16,
                borderTopLeftRadius: 4,
                padding: '10px 14px',
                marginBottom: 8,
              }}
            >
              <FormattedText text={msg.content} />
            </div>
            {!msg.answered && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {msg.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(msg.id, opt)}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #5B21B6',
                      borderRadius: 12,
                      padding: '9px 14px',
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#5B21B6',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    if (msg.type === 'pdf_ready') {
      return (
        <div key={msg.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <BotAvatar />
          <div
            style={{
              background: '#F3F4F6',
              borderRadius: 16,
              borderTopLeftRadius: 4,
              padding: '12px 14px',
              maxWidth: '85%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  background: '#EDE9FE',
                  borderRadius: 8,
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#5B21B6">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline
                    points="14 2 14 8 20 8"
                    stroke="#fff"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <line x1="16" y1="13" x2="8" y2="13" stroke="#fff" strokeWidth="1.5" />
                  <line x1="16" y1="17" x2="8" y2="17" stroke="#fff" strokeWidth="1.5" />
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>
                  {msg.pdfTitle}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>Listo para descargar</p>
              </div>
            </div>

            {msg.content && (
              <div style={{ marginBottom: 10 }}>
                <FormattedText text={msg.content} color="#374151" size={13} />
              </div>
            )}

            <button
              onClick={() =>
                generateSalesPDF({
                  title: msg.pdfTitle,
                  period: msg.period,
                  summary: msg.content,
                  tableData: msg.tableData,
                  totalAmount: msg.totalAmount,
                })
              }
              style={{
                background: '#5B21B6',
                border: 'none',
                borderRadius: 10,
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descargar PDF
            </button>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <>
      <style>{`
        @keyframes mipana-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        .mipana-scroll::-webkit-scrollbar { display: none; }
        .mipana-input::placeholder {
          color: #6B7280;
          opacity: 1;
          font-weight: 500;
        }
        body { overflow: hidden; }
      `}</style>
      <div
        style={{
          background: '#f2f2f7',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 390,
            height: '100svh',
            maxHeight: 844,
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
              onClick={onBack}
              style={{
                position: 'absolute',
                left: 20,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
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
                <img
                  src={logomipanaIcon}
                  alt="Mi Pana"
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

            <div
              style={{
                position: 'absolute',
                right: 20,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#0F766E',
                      animation: 'mipana-bounce 1.2s infinite',
                    }}
                  />
                  <span style={{ fontSize: 11, color: '#0F766E' }}>escribiendo...</span>
                </div>
              ) : (
                <button
                  onClick={() =>
                    setProvider((p) => {
                      const cycle: (AIProvider | 'backend')[] = ['deepseek', 'openai', 'groq', 'backend']
                      return cycle[(cycle.indexOf(p) + 1) % cycle.length]
                    })
                  }
                  title={
                    provider === 'backend'
                      ? 'Backend local — clic para cambiar'
                      : `${AI_PROVIDERS[provider as AIProvider].label} — clic para cambiar`
                  }
                  style={{
                    background:
                      provider === 'backend'
                        ? '#0F766E'
                        : AI_PROVIDERS[provider as AIProvider].color,
                    border: 'none',
                    borderRadius: 12,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  {provider === 'backend'
                    ? '🏠 Local'
                    : `${AI_PROVIDERS[provider as AIProvider].emoji} ${AI_PROVIDERS[provider as AIProvider].label}`}
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="mipana-scroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              paddingBottom: 16,
            } as React.CSSProperties}
          >
            {uiMessages.map(renderMessage)}

            {/* Quick actions — solo al inicio */}
            {uiMessages.length === 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 48 }}>
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.message)}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #E5E7EB',
                      borderRadius: 20,
                      padding: '8px 14px',
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#5B21B6',
                      cursor: 'pointer',
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
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
              <input
                className="mipana-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
                placeholder="Escribe tu mensaje..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  fontSize: 15,
                  color: '#111827',
                  fontWeight: 500,
                  outline: 'none',
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: input.trim() && !isLoading ? '#5B21B6' : '#D1D5DB',
                  border: 'none',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
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
              </button>
            </div>
          </div>

          <BottomNavBar activeTab={navTab} onTabChange={handleNavChange} />
        </div>
      </div>
    </>
  )
}
