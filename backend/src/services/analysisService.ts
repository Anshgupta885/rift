/**
 * Analysis Service
 * Orchestrates transaction analysis workflow
 */

import { v4 as uuidv4 } from 'uuid';
import { Transaction, AnalysisResponse, SuspiciousAccount, FraudRing, AIServiceResponse } from '../types';
import { buildGraphData } from '../utils/csvParser';
import { analyzeTransactions, performLocalAnalysis, checkAIServiceHealth } from './aiService';
import { Analysis } from '../models/Analysis.model';

/**
 * Process uploaded transactions and generate analysis
 */
export async function processTransactions(
  transactions: Transaction[],
  fileName: string
): Promise<{ sessionId: string; response: AnalysisResponse }> {
  const sessionId = uuidv4();
  const startTime = Date.now();
  
  let aiResponse: AIServiceResponse;
  
  // Try Python AI service first, fallback to local
  const aiServiceAvailable = await checkAIServiceHealth();
  
  if (aiServiceAvailable) {
    console.log('Using Python AI service for analysis');
    aiResponse = await analyzeTransactions(transactions);
  } else {
    console.log('AI service unavailable, using local analysis');
    aiResponse = performLocalAnalysis(transactions);
  }
  
  // Build fraud ring edge set for visualization
  const fraudRingEdges = new Set<string>();
  for (const ring of aiResponse.fraud_rings) {
    const members = ring.member_accounts;
    for (let i = 0; i < members.length; i++) {
      const next = (i + 1) % members.length;
      fraudRingEdges.add(`${members[i]}-${members[next]}`);
    }
  }
  
  // Build graph data for visualization
  const graphData = buildGraphData(
    transactions,
    aiResponse.account_scores,
    fraudRingEdges
  );
  
  // Build suspicious accounts list (sorted by score descending)
  const suspiciousAccounts: SuspiciousAccount[] = Object.entries(aiResponse.account_scores)
    .filter(([_, data]) => data.score > 0)
    .map(([accountId, data]) => ({
      account_id: accountId,
      suspicion_score: Math.round(data.score * 10) / 10,
      detected_patterns: data.patterns,
      ring_id: data.ring_id
    }))
    .sort((a, b) => b.suspicion_score - a.suspicion_score);
  
  // Calculate unique accounts
  const uniqueAccounts = new Set<string>();
  for (const tx of transactions) {
    uniqueAccounts.add(tx.sender_id);
    uniqueAccounts.add(tx.receiver_id);
  }
  
  const processingTime = (Date.now() - startTime) / 1000;
  
  const response: AnalysisResponse = {
    graph_data: graphData,
    fraud_analysis: {
      suspicious_accounts: suspiciousAccounts,
      fraud_rings: aiResponse.fraud_rings.map(ring => ({
        ...ring,
        risk_score: Math.round(ring.risk_score * 10) / 10
      })),
      summary: {
        total_accounts_analyzed: uniqueAccounts.size,
        suspicious_accounts_flagged: suspiciousAccounts.length,
        fraud_rings_detected: aiResponse.fraud_rings.length,
        processing_time_seconds: Math.round(processingTime * 10) / 10
      }
    }
  };
  
  // Save to MongoDB (non-blocking)
  saveAnalysis(sessionId, fileName, response, transactions).catch(err => {
    console.error('Failed to save analysis:', err.message);
  });
  
  return { sessionId, response };
}

/**
 * Save analysis to MongoDB
 */
async function saveAnalysis(
  sessionId: string,
  fileName: string,
  response: AnalysisResponse,
  transactions: Transaction[]
): Promise<void> {
  try {
    const analysis = new Analysis({
      sessionId,
      fileName,
      graphData: response.graph_data,
      fraudAnalysis: response.fraud_analysis,
      rawTransactions: transactions
    });
    
    await analysis.save();
    console.log(`Analysis saved with session ID: ${sessionId}`);
  } catch (error) {
    console.error('MongoDB save error:', (error as Error).message);
  }
}

/**
 * Get analysis by session ID
 */
export async function getAnalysisBySession(sessionId: string): Promise<AnalysisResponse | null> {
  try {
    const analysis = await Analysis.findOne({ sessionId });
    if (!analysis) return null;
    
    return {
      graph_data: analysis.graphData,
      fraud_analysis: analysis.fraudAnalysis
    };
  } catch (error) {
    console.error('MongoDB query error:', (error as Error).message);
    return null;
  }
}

/**
 * Format analysis for JSON download
 */
export function formatForDownload(response: AnalysisResponse): object {
  return {
    suspicious_accounts: response.fraud_analysis.suspicious_accounts,
    fraud_rings: response.fraud_analysis.fraud_rings,
    summary: response.fraud_analysis.summary
  };
}
