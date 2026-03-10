import { Content, Tool } from "@google/genai";

export type Mood = "light" | "dark";

export type StreamMode = "buffered" | "speculative";

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'completed';
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export type StreamYield =
  | { text: string }
  | { groundingChunks: GroundingChunk[] };

export interface StreamChatResponseArgs {
  modelName: string;
  formattedHistory: Content[];
  tools: Tool[];
  newMessage: string;
  onMoodChange?: (mood: Mood) => void;
  onTaskOperation?: (operation: 'create' | 'update', payload: any) => any;
  currentTasks?: Task[];
  streamMode?: StreamMode;
}

export interface ToolCall {
  id?: string;
  name: string;
  args?: any;
}

export interface ToolResponse {
  functionResponse: {
    id?: string;
    name: string;
    response: any;
  };
}
