export type Message = {
    id?: number;
    type: 'response' | 'error' | 'prompt';
    content: string;
    images?: string[];
};

export type ChatType = {
    id: number;
    title: string;
    messages: Message[];
    created_at: string;
    updated_at: string;
};