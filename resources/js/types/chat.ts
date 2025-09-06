export type MessageType = 'prompt' | 'response' | 'feedback' | 'error';

export type CompilerInfo = {
  type: 'compiler_feedback';
  prompt?: string | null;
  system?: string | null;
  temperature?: number | null;
  max_tokens?: number | null;
  context?: any;
  confidence?: number | null;
  suggestions?: string[];
  feedbackText?: string | null;
};

export type Message = {
    id?: number;
    chat_id?: number;
    type: MessageType;          // ⬅ inclui 'feedback'
    content: string;
    images?: string[];
    parent_id?: number | null;  // ⬅ novo
    meta?: CompilerInfo | null; // ⬅ novo
    created_at?: string;
    updated_at?: string;
  };

export type ChatType = {
    id: number;
    title: string;
    messages: Message[];
    created_at: string;
    updated_at: string;
};