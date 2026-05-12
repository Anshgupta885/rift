"use strict";
/**
 * Analysis Service
 * Orchestrates transaction analysis workflow
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTransactions = processTransactions;
exports.getAnalysisBySession = getAnalysisBySession;
exports.formatForDownload = formatForDownload;
const uuid_1 = require("uuid");
const csvParser_1 = require("../utils/csvParser");
const aiService_1 = require("./aiService");
const Analysis_model_1 = require("../models/Analysis.model");
/**
 * Process uploaded transactions and generate analysis
 */
async function processTransactions(transactions, fileName) {
    const sessionId = (0, uuid_1.v4)();
    const startTime = Date.now();
    let aiResponse;
    // Try Python AI service first, fallback to local
    const aiServiceAvailable = await (0, aiService_1.checkAIServiceHealth)();
    if (aiServiceAvailable) {
        console.log('Using Python AI service for analysis');
        aiResponse = await (0, aiService_1.analyzeTransactions)(transactions);
    }
    else {
        console.log('AI service unavailable, using local analysis');
        aiResponse = (0, aiService_1.performLocalAnalysis)(transactions);
    }
    // Build fraud ring edge set for visualization
    const fraudRingEdges = new Set();
    for (const ring of aiResponse.fraud_rings) {
        const members = ring.member_accounts;
        for (let i = 0; i < members.length; i++) {
            const next = (i + 1) % members.length;
            fraudRingEdges.add(`${members[i]}-${members[next]}`);
        }
    }
    // Build graph data for visualization
    const graphData = (0, csvParser_1.buildGraphData)(transactions, aiResponse.account_scores, fraudRingEdges);
    // Build suspicious accounts list (sorted by score descending)
    const suspiciousAccounts = Object.entries(aiResponse.account_scores)
        .filter(([_, data]) => data.score > 0)
        .map(([accountId, data]) => ({
        account_id: accountId,
        suspicion_score: Math.round(data.score * 10) / 10,
        detected_patterns: data.patterns,
        ring_id: data.ring_id
    }))
        .sort((a, b) => b.suspicion_score - a.suspicion_score);
    // Calculate unique accounts
    const uniqueAccounts = new Set();
    for (const tx of transactions) {
        uniqueAccounts.add(tx.sender_id);
        uniqueAccounts.add(tx.receiver_id);
    }
    const processingTime = (Date.now() - startTime) / 1000;
    const response = {
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
async function saveAnalysis(sessionId, fileName, response, transactions) {
    try {
        const analysis = new Analysis_model_1.Analysis({
            sessionId,
            fileName,
            graphData: response.graph_data,
            fraudAnalysis: response.fraud_analysis,
            rawTransactions: transactions
        });
        await analysis.save();
        console.log(`Analysis saved with session ID: ${sessionId}`);
    }
    catch (error) {
        console.error('MongoDB save error:', error.message);
    }
}
/**
 * Get analysis by session ID
 */
async function getAnalysisBySession(sessionId) {
    try {
        const analysis = await Analysis_model_1.Analysis.findOne({ sessionId });
        if (!analysis)
            return null;
        return {
            graph_data: analysis.graphData,
            fraud_analysis: analysis.fraudAnalysis
        };
    }
    catch (error) {
        console.error('MongoDB query error:', error.message);
        return null;
    }
}
/**
 * Format analysis for JSON download
 */
function formatForDownload(response) {
    return {
        suspicious_accounts: response.fraud_analysis.suspicious_accounts,
        fraud_rings: response.fraud_analysis.fraud_rings,
        summary: response.fraud_analysis.summary
    };
}
//# sourceMappingURL=analysisService.js.map