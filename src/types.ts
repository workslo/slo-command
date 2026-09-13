export type Role = 'user' | 'model';

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  modelInfo?: string;
  imageUrl?: string;
}

export type ModelAlias = 'gemini-3.5-flash' | 'gemini-3.6-flash' | 'gemini-3.7-flash';

export interface ChatState {
  messages: Message[];
  systemInstruction: string;
  selectedModel: ModelAlias;
}

export type AppMode = 'chat' | 'image-gen' | 'image-edit' | 'search' | 'maps' | 'archive' | 'journal' | 'prompts';
