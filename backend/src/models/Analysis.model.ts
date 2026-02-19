/**
 * MongoDB Schema for Analysis Results
 */

import mongoose, { Schema, Document } from 'mongoose';
import { FraudAnalysis, GraphData } from '../types';

export interface IAnalysisDocument extends Document {
  sessionId: string;
  fileName: string;
  graphData: GraphData;
  fraudAnalysis: FraudAnalysis;
  rawTransactions: any[];
  createdAt: Date;
  updatedAt: Date;
}

const SuspiciousAccountSchema = new Schema({
  account_id: { type: String, required: true },
  suspicion_score: { type: Number, required: true },
  detected_patterns: [{ type: String }],
  ring_id: { type: String, default: null }
}, { _id: false });

const FraudRingSchema = new Schema({
  ring_id: { type: String, required: true },
  member_accounts: [{ type: String }],
  pattern_type: { type: String, required: true },
  risk_score: { type: Number, required: true }
}, { _id: false });

const SummarySchema = new Schema({
  total_accounts_analyzed: { type: Number, required: true },
  suspicious_accounts_flagged: { type: Number, required: true },
  fraud_rings_detected: { type: Number, required: true },
  processing_time_seconds: { type: Number, required: true }
}, { _id: false });

const GraphNodeSchema = new Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  suspicious: { type: Boolean, default: false },
  suspicion_score: { type: Number, default: 0 },
  patterns: [{ type: String }],
  ring_id: { type: String, default: null }
}, { _id: false });

const GraphEdgeSchema = new Schema({
  source: { type: String, required: true },
  target: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: String, required: true },
  transaction_id: { type: String, required: true },
  is_fraud_ring_edge: { type: Boolean, default: false }
}, { _id: false });

const AnalysisSchema = new Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  fileName: { type: String, required: true },
  graphData: {
    nodes: [GraphNodeSchema],
    edges: [GraphEdgeSchema]
  },
  fraudAnalysis: {
    suspicious_accounts: [SuspiciousAccountSchema],
    fraud_rings: [FraudRingSchema],
    summary: SummarySchema
  },
  rawTransactions: [{ type: Schema.Types.Mixed }]
}, {
  timestamps: true
});

export const Analysis = mongoose.model<IAnalysisDocument>('Analysis', AnalysisSchema);
