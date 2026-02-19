/**
 * TypeScript interfaces for the Financial Crime Detection Engine.
 * These define the strict JSON output format as specified.
 */

// CSV Input Schema
export interface Transaction {
  transaction_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  timestamp: string;
}

// Graph Data for Visualization
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

// STRICT JSON OUTPUT FORMAT
export interface SuspiciousAccount {
  account_id: string;
  suspicion_score: number; // 0-100, rounded to 1 decimal
  detected_patterns: string[];
  ring_id: string | null;
}

export interface FraudRing {
  ring_id: string;
  member_accounts: string[];
  pattern_type: string;
  risk_score: number; // 0-100, rounded to 1 decimal
}

export interface AnalysisSummary {
  total_accounts_analyzed: number;
  suspicious_accounts_flagged: number;
  fraud_rings_detected: number;
  processing_time_seconds: number; // rounded to 1 decimal
}

export interface FraudAnalysis {
  suspicious_accounts: SuspiciousAccount[];
  fraud_rings: FraudRing[];
  summary: AnalysisSummary;
}

export interface AnalysisResponse {
  graph_data: GraphData;
  fraud_analysis: FraudAnalysis;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// AI Service Response
export interface AIServiceResponse {
  cycles: string[][];
  smurfing: {
    fan_in: Record<string, string[]>;
    fan_out: Record<string, string[]>;
  };
  shell_networks: string[][];
  high_velocity: Record<string, number>;
  merchants: string[];
  account_scores: Record<string, {
    score: number;
    patterns: string[];
    ring_id: string | null;
  }>;
  fraud_rings: FraudRing[];
  processing_time: number;
}
