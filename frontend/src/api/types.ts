// TypeScript mirrors of the backend Pydantic schemas.
// Keep in sync with backend/app/models/schemas.py.

export type WordCategory =
  | "pronoun"
  | "verb"
  | "noun"
  | "adjective"
  | "social"
  | "question"
  | "urgent";

export interface PredictedWord {
  word: string;
  category: WordCategory;
  urgent: boolean;
  rank: number;
  reason: string;
}

export interface GridPredictionRequest {
  session_id?: string | null;
  current_tokens: string[];
  caregiver_utterance: string;
  exclude_words: string[];
  time_of_day: string;
  grid_size: number;
}

export interface GridPredictionResponse {
  symbols: PredictedWord[];
  request_id?: string | null;
  model: string;
  latency_ms: number;
}

export interface SentenceComposeRequest {
  session_id?: string | null;
  tokens: string[];
  caregiver_utterance: string;
}

export interface SentenceComposeResponse {
  sentence: string;
  request_id?: string | null;
  model: string;
  latency_ms: number;
}

export interface QuickRepliesRequest {
  session_id?: string | null;
  caregiver_utterance: string;
}

export interface QuickRepliesResponse {
  replies: string[];
  request_id?: string | null;
  model: string;
  latency_ms: number;
}

export interface TranscriptionResponse {
  text: string;
  request_id?: string | null;
  latency_ms: number;
}

export interface MemoryExtractRequest {
  session_id?: string | null;
  caregiver_text: string;
  child_text: string;
}

export interface ExtractedFact {
  key: string;
  value: string;
  type: "permanent" | "temporary";
}

export interface MemoryExtractResponse {
  facts: ExtractedFact[];
  request_id?: string | null;
  model: string;
  latency_ms: number;
}

export interface FindWordsRequest {
  session_id?: string | null;
  query: string;
  caregiver_utterance: string;
  grid_size: number;
}

export interface FindWordsResponse {
  symbols: PredictedWord[];
  request_id?: string | null;
  model: string;
  latency_ms: number;
}