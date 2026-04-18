import type { OpenAIMessage, ToolCall } from "../types/chat";
import { getSalesContext } from "./csvProcessor";

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY as string;
const BASE_URL = "https://api.deepseek.com/v1";

const SALES_CONTEXT = getSalesContext("COM-001");

const SYSTEM_PROMPT = `Eres Mi Pana, el asistente inteligente de ventas para pequeños negocios en Ecuador. Eres amigable, directo y hablas en español informal.

${SALES_CONTEXT}

REGLAS DE FORMATO (MUY IMPORTANTE):
- NO uses markdown: sin **, sin #, sin *, sin tablas
- NO uses emojis en tus respuestas de texto
- Para listas usa guion simple: "- item" (con salto de línea \n entre cada uno)
- Separa párrafos con una línea en blanco (\n\n)
- Respuestas cortas: máx 3 párrafos o 5 bullets
- Siempre responde en español informal

REGLAS DE HERRAMIENTAS:
- Usa show_chart para mostrar datos visualmente (ventas por período, categorías, comparativas)
- Usa ask_clarification con 2-4 opciones cuando el usuario no especifique el período u otro parámetro
- Usa generate_pdf_report cuando el usuario pida descargar, exportar o generar un reporte/PDF
- Después de una gráfica, ofrece el PDF en texto simple`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "show_chart",
      description: "Muestra una gráfica visual al usuario con datos de ventas",
      parameters: {
        type: "object",
        required: ["chart_type", "title", "data", "summary"],
        properties: {
          chart_type: {
            type: "string",
            enum: ["bar", "pie"],
            description: "Tipo de gráfica",
          },
          title: { type: "string", description: "Título de la gráfica" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                value: { type: "number" },
              },
            },
            description: "Datos para la gráfica",
          },
          summary: {
            type: "string",
            description: "Análisis breve para el usuario",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_clarification",
      description:
        "Hace una pregunta de opción múltiple al usuario para obtener más contexto",
      parameters: {
        type: "object",
        required: ["question", "options"],
        properties: {
          question: {
            type: "string",
            description: "Pregunta a hacerle al usuario",
          },
          options: {
            type: "array",
            items: { type: "string" },
            description: "Lista de 2-4 opciones",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_pdf_report",
      description: "Genera un reporte PDF descargable con datos de ventas",
      parameters: {
        type: "object",
        required: ["title", "period", "summary", "table_data", "total_amount"],
        properties: {
          title: { type: "string", description: "Título del reporte" },
          period: {
            type: "string",
            enum: ["weekly", "monthly", "annual"],
            description: "Período del reporte",
          },
          summary: {
            type: "string",
            description: "Resumen ejecutivo del reporte",
          },
          table_data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                amount: { type: "number" },
                transactions: { type: "number" },
              },
            },
          },
          total_amount: { type: "number", description: "Total del período" },
        },
      },
    },
  },
];

export interface ToolCallResult {
  tool_call_id: string;
  name: string;
  result: string;
}

export interface DeepSeekResponse {
  text: string | null;
  toolCalls: ToolCall[] | null;
  rawAssistantMessage: OpenAIMessage;
}

export async function callDeepSeek(
  messages: OpenAIMessage[],
): Promise<DeepSeekResponse> {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      tools: TOOLS,
      tool_choice: "auto",
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error de API (${response.status}): ${error}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  if (!choice) throw new Error("Sin respuesta de la API");

  const msg = choice.message;
  return {
    text: msg.content ?? null,
    toolCalls: msg.tool_calls ?? null,
    rawAssistantMessage: {
      role: "assistant",
      content: msg.content ?? null,
      tool_calls: msg.tool_calls,
    },
  };
}

export async function callDeepSeekWithToolResults(
  messages: OpenAIMessage[],
  assistantMessage: OpenAIMessage,
  toolResults: ToolCallResult[],
): Promise<string> {
  const toolMessages: OpenAIMessage[] = toolResults.map((r) => ({
    role: "tool",
    content: r.result,
    tool_call_id: r.tool_call_id,
    name: r.name,
  }));

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
        assistantMessage,
        ...toolMessages,
      ],
      max_tokens: 512,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error de API (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}
