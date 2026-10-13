export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export type TicketStatus = "open" | "in_progress" | "resolved";

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chatbot {
  id: string;
  workspaceId: string;
  name: string;
  systemPrompt: string;
  primaryColor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  workspaceId: string;
  filename: string;
  storagePath: string;
  sizeBytes: number;
  status: "pending" | "processed" | "failed";
  createdAt: string;
  updatedAt?: string;
}

export interface SupportTicket {
  id: string;
  workspaceId: string;
  conversationId: string | null;
  createdBy: string;
  subject: string;
  description: string;
  status: TicketStatus;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResultChunk {
  chunk_id: string;
  document_id: string;
  filename: string;
  content: string;
  similarity: number;
}

export interface ChatSource {
  filename: string;
  content: string;
  similarity: number;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  handoff?: boolean;
  ticket?: {
    id: string;
    status: string;
  };
}



export interface UserProfile {
  name: string;
  email: string;
}
