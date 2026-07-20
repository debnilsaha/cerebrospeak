// Typed API client. All requests go through Vite's /api proxy to the backend.

import type {
  FindWordsRequest,
  FindWordsResponse,
  GridPredictionRequest,
  GridPredictionResponse,
  MemoryExtractRequest,
  MemoryExtractResponse,
  QuickRepliesRequest,
  QuickRepliesResponse,
  SentenceComposeRequest,
  SentenceComposeResponse,
  TranscriptionResponse,
  SessionEndRequest,
  SessionStartResponse,
  SessionSummaryResponse,  
  MemoryFacts,
  SessionRecord,
} from "./types";

const BASE = "/api";

class ApiError extends Error {
  status: number;
  requestId?: string;

  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
  }
}

async function postJson<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const requestId = res.headers.get("X-Request-ID") ?? undefined;
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data?.error?.message ?? message;
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(message, res.status, requestId);
  }
  return (await res.json()) as TRes;
}

export const api = {
  // Health
  async health(): Promise<{ status: string; app: string }> {
    const res = await fetch(`${BASE}/health`);
    if (!res.ok) throw new ApiError("Health check failed", res.status);
    return res.json();
  },

  // Prediction
  predictGrid(req: GridPredictionRequest): Promise<GridPredictionResponse> {
    return postJson("/predict/grid", req);
  },

  quickReplies(req: QuickRepliesRequest): Promise<QuickRepliesResponse> {
    return postJson("/predict/quick-replies", req);
  },

  findWords(req: FindWordsRequest): Promise<FindWordsResponse> {
    return postJson("/predict/find-words", req);
  },

  // Sentence
  composeSentence(req: SentenceComposeRequest): Promise<SentenceComposeResponse> {
    return postJson("/sentence/compose", req);
  },

  // Memory
  extractMemory(req: MemoryExtractRequest): Promise<MemoryExtractResponse> {
    return postJson("/memory/extract", req);
  },

  startSession(): Promise<SessionStartResponse> {
    return fetch(`${BASE}/sessions`, { method: "POST" }).then((r) => {
      if (!r.ok) throw new ApiError("Failed to start session", r.status);
      return r.json();
    });
  },

  endSession(req: SessionEndRequest): Promise<SessionSummaryResponse> {
    return postJson("/sessions/end", req);
  },

  listSessions(): Promise<SessionRecord[]> {
    return fetch(`${BASE}/sessions`).then((r) => {
      if (!r.ok) throw new ApiError("Failed to list sessions", r.status);
      return r.json();
    });
  },

  getMemory(): Promise<MemoryFacts> {
    return fetch(`${BASE}/memory`).then((r) => {
      if (!r.ok) throw new ApiError("Failed to load memory", r.status);
      return r.json();
    });
  },

  deleteMemoryFact(key: string): Promise<{ deleted: string }> {
    return fetch(`${BASE}/memory/${encodeURIComponent(key)}`, {
      method: "DELETE",
    }).then((r) => {
      if (!r.ok) throw new ApiError("Failed to delete fact", r.status);
      return r.json();
    });
  },

  updateMemoryFact(key: string, value: string): Promise<{ updated: string; value: string }> {
    return fetch(`${BASE}/memory/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    }).then((r) => {
      if (!r.ok) throw new ApiError("Failed to update fact", r.status);
      return r.json();
    });
  },  

  // Speech: transcribe (audio file -> text)
  async transcribe(audio: Blob): Promise<TranscriptionResponse> {
    const form = new FormData();
    form.append("file", audio, "recording.webm");
    const res = await fetch(`${BASE}/speech/transcribe`, {
      method: "POST",
      body: form,
    });
    const requestId = res.headers.get("X-Request-ID") ?? undefined;
    if (!res.ok) {
      throw new ApiError("Transcription failed", res.status, requestId);
    }
    return res.json();
  },

  // Speech: synthesize (text -> audio blob URL)
  async synthesize(text: string): Promise<string> {
    const res = await fetch(`${BASE}/speech/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      throw new ApiError("Synthesis failed", res.status);
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};

export { ApiError };