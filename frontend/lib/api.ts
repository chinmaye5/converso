import axios, { AxiosError } from "axios";
import type {
  Chatbot,
  ChatSource,
  Conversation,
  ConversationMessage,
  DocumentItem,
  SearchResultChunk,
  SupportTicket,
  TicketDetail,
  TicketStatus,
  UserProfile,
  Workspace,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function handleApiError(error: unknown): never {
  if (error instanceof AxiosError) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";
    throw new Error(message);
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error("An unexpected error occurred");
}

/* ============================================================
   WORKSPACES
   ============================================================ */

export async function getWorkspaces(token: string): Promise<Workspace[]> {
  try {
    const res = await axios.get<{ workspaces: Workspace[] }>(
      `${API_BASE}/api/workspaces`,
      { headers: authHeaders(token) },
    );
    return res.data.workspaces || [];
  } catch (error) {
    return handleApiError(error);
  }
}

export async function getWorkspace(
  token: string,
  id: string,
): Promise<Workspace> {
  try {
    const res = await axios.get<{ workspace: Workspace }>(
      `${API_BASE}/api/workspaces/${id}`,
      { headers: authHeaders(token) },
    );
    return res.data.workspace;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function createWorkspace(
  token: string,
  name: string,
): Promise<Workspace> {
  try {
    const res = await axios.post<{ workspace: Workspace }>(
      `${API_BASE}/api/workspaces`,
      { name },
      { headers: authHeaders(token) },
    );
    return res.data.workspace;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function updateWorkspace(
  token: string,
  id: string,
  name: string,
): Promise<Workspace> {
  try {
    const res = await axios.patch<{ workspace: Workspace }>(
      `${API_BASE}/api/workspaces/${id}`,
      { name },
      { headers: authHeaders(token) },
    );
    return res.data.workspace;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function deleteWorkspace(
  token: string,
  id: string,
): Promise<void> {
  try {
    await axios.delete(`${API_BASE}/api/workspaces/${id}`, {
      headers: authHeaders(token),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/* ============================================================
   CHATBOT
   ============================================================ */

export async function getChatbot(
  token: string,
  workspaceId: string,
): Promise<Chatbot | null> {
  try {
    const res = await axios.get<{ chatbot: Chatbot }>(
      `${API_BASE}/api/workspaces/${workspaceId}/chatbot`,
      { headers: authHeaders(token) },
    );
    return res.data.chatbot;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null;
    }
    return handleApiError(error);
  }
}

export async function createChatbot(
  token: string,
  workspaceId: string,
  name = "Support Assistant",
): Promise<Chatbot> {
  try {
    const res = await axios.post<{ chatbot: Chatbot }>(
      `${API_BASE}/api/workspaces/${workspaceId}/chatbot`,
      { name },
      { headers: authHeaders(token) },
    );
    return res.data.chatbot;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function updateChatbot(
  token: string,
  workspaceId: string,
  data: Partial<Pick<Chatbot, "name" | "systemPrompt" | "primaryColor" | "isActive">>,
): Promise<Chatbot> {
  try {
    const res = await axios.patch<{ chatbot: Chatbot }>(
      `${API_BASE}/api/workspaces/${workspaceId}/chatbot`,
      data,
      { headers: authHeaders(token) },
    );
    return res.data.chatbot;
  } catch (error) {
    return handleApiError(error);
  }
}

/* ============================================================
   DOCUMENTS & KNOWLEDGE
   ============================================================ */

export async function uploadDocument(
  token: string,
  workspaceId: string,
  file: File,
  onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void,
): Promise<{ document: DocumentItem; chunksCreated?: number; warning?: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post<{
      document: DocumentItem;
      chunksCreated?: number;
      warning?: string;
    }>(`${API_BASE}/api/workspaces/${workspaceId}/documents`, formData, {
      headers: {
        ...authHeaders(token),
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (e) => {
        if (onUploadProgress) {
          onUploadProgress({ loaded: e.loaded, total: e.total });
        }
      },
    });

    return res.data;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function searchKnowledge(
  token: string,
  workspaceId: string,
  question: string,
  limit = 5,
): Promise<SearchResultChunk[]> {
  try {
    const res = await axios.post<{ results: SearchResultChunk[] }>(
      `${API_BASE}/api/workspaces/${workspaceId}/search`,
      { question, limit },
      { headers: authHeaders(token) },
    );
    return res.data.results || [];
  } catch (error) {
    return handleApiError(error);
  }
}

/* ============================================================
   SUPPORT TICKETS
   ============================================================ */

export async function getTickets(
  token: string,
  workspaceId: string,
): Promise<SupportTicket[]> {
  try {
    const res = await axios.get<{ tickets: SupportTicket[] }>(
      `${API_BASE}/api/workspaces/${workspaceId}/tickets`,
      { headers: authHeaders(token) },
    );
    return res.data.tickets || [];
  } catch (error) {
    return handleApiError(error);
  }
}

export async function createTicket(
  token: string,
  workspaceId: string,
  data: { subject: string; description: string; conversationId?: string },
): Promise<SupportTicket> {
  try {
    const res = await axios.post<{ ticket: SupportTicket }>(
      `${API_BASE}/api/workspaces/${workspaceId}/tickets`,
      data,
      { headers: authHeaders(token) },
    );
    return res.data.ticket;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function updateTicketStatus(
  token: string,
  workspaceId: string,
  ticketId: string,
  status: TicketStatus,
): Promise<SupportTicket> {
  try {
    const res = await axios.patch<{ ticket: SupportTicket }>(
      `${API_BASE}/api/workspaces/${workspaceId}/tickets/${ticketId}/status`,
      { status },
      { headers: authHeaders(token) },
    );
    return res.data.ticket;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function getTicketWithConversation(
  token: string,
  workspaceId: string,
  ticketId: string,
): Promise<TicketDetail> {
  try {
    const res = await axios.get<TicketDetail>(
      `${API_BASE}/api/workspaces/${workspaceId}/tickets/${ticketId}`,
      { headers: authHeaders(token) },
    );
    return res.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/* ============================================================
   AUTHENTICATED CHAT (PLAYGROUND)
   ============================================================ */

export async function chatWithBot(
  token: string,
  workspaceId: string,
  question: string,
  conversationId?: string,
): Promise<{
  conversationId: string;
  answer?: string;
  sources?: ChatSource[];
  handoff?: boolean;
  message?: string;
  ticket?: { id: string; status: string };
}> {
  try {
    const res = await axios.post(
      `${API_BASE}/api/workspaces/${workspaceId}/chat`,
      {
        question,
        conversationId,
      },
      { headers: authHeaders(token) },
    );
    return res.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/* ============================================================
   USER PROFILE
   ============================================================ */

export async function getProfile(token: string): Promise<UserProfile> {
  try {
    const res = await axios.get<UserProfile>(`${API_BASE}/api/profile`, {
      headers: authHeaders(token),
    });
    return res.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/* ============================================================
   CONVERSATIONS
   ============================================================ */

export async function getConversations(
  token: string,
  workspaceId: string,
  limit = 20,
  offset = 0,
): Promise<Conversation[]> {
  try {
    const res = await axios.get<{ conversations: Conversation[] }>(
      `${API_BASE}/api/workspaces/${workspaceId}/conversations`,
      {
        headers: authHeaders(token),
        params: { limit, offset },
      },
    );
    return res.data.conversations || [];
  } catch (error) {
    return handleApiError(error);
  }
}

export async function getConversationMessages(
  token: string,
  workspaceId: string,
  conversationId: string,
): Promise<{ conversation: Conversation; messages: ConversationMessage[] }> {
  try {
    const res = await axios.get<{
      conversation: Conversation;
      messages: ConversationMessage[];
    }>(
      `${API_BASE}/api/workspaces/${workspaceId}/conversations/${conversationId}/messages`,
      { headers: authHeaders(token) },
    );
    return res.data;
  } catch (error) {
    return handleApiError(error);
  }
}

