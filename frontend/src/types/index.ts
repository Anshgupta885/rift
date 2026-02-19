/**
 * TypeScript types for the Financial Crime Detection Engine frontend.
 */

// Graph visualization types
export interface GraphNode {
  id: string;
  label: string;
  suspicious: boolean;
  suspicion_score: number;
  patterns: string[];
  ring_id: string | null;
}

export interface GraphEdge {
  source: string;
  target: string;
  amount: number;
  timestamp: string;
  transaction_id: string;
  is_fraud_ring_edge: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Fraud analysis types
export interface SuspiciousAccount {
  account_id: string;
  suspicion_score: number;
  detected_patterns: string[];
  ring_id: string | null;
}

export interface FraudRing {
  ring_id: string;
  member_accounts: string[];
  pattern_type: string;
  risk_score: number;
}

export interface AnalysisSummary {
  total_accounts_analyzed: number;
  suspicious_accounts_flagged: number;
  fraud_rings_detected: number;
  processing_time_seconds: number;
}

export interface FraudAnalysis {
  suspicious_accounts: SuspiciousAccount[];
  fraud_rings: FraudRing[];
  summary: AnalysisSummary;
}

// API response types
export interface AnalysisResponse {
  graph_data: GraphData;
  fraud_analysis: FraudAnalysis;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  sessionId?: string;
  data?: T;
}

// Application state types
export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export interface AppState {
  uploadStatus: UploadStatus;
  analysisData: AnalysisResponse | null;
  sessionId: string | null;
  error: string | null;
}

// Table sorting
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

// Filter options
export interface FilterOptions {
  minScore: number;
  maxScore: number;
  patterns: string[];
  showOnlySuspicious: boolean;
}
