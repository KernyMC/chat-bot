export type ChartType = 'bar' | 'pie'

export interface ChartDataPoint {
  name: string
  value: number
}

interface MessageBase {
  id: string
  role: 'user' | 'assistant'
  timestamp: number
}

export interface TextMessage extends MessageBase {
  type: 'text'
  content: string
}

export interface ChartMessage extends MessageBase {
  type: 'chart'
  content: string
  chartType: ChartType
  title: string
  data: ChartDataPoint[]
}

export interface MultipleChoiceMessage extends MessageBase {
  type: 'multiple_choice'
  content: string
  options: string[]
  answered: boolean
}

export interface PDFReadyMessage extends MessageBase {
  type: 'pdf_ready'
  content: string
  pdfTitle: string
  period: string
  tableData: Array<{ label: string; amount: number; transactions?: number }>
  totalAmount: number
}

export interface LoadingMessage extends MessageBase {
  type: 'loading'
  content: ''
}

export type ChatMessage =
  | TextMessage
  | ChartMessage
  | MultipleChoiceMessage
  | PDFReadyMessage
  | LoadingMessage

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}
