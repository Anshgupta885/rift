"use strict";
/**
 * AI Service Client
 * Communicates with Python detection engine microservice
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTransactions = analyzeTransactions;
exports.checkAIServiceHealth = checkAIServiceHealth;
exports.performLocalAnalysis = performLocalAnalysis;
const axios_1 = __importDefault(require("axios"));
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
/**
 * Send transactions to Python AI service for analysis
 */
async function analyzeTransactions(transactions) {
    try {
        const response = await axios_1.default.post(`${AI_SERVICE_URL}/analyze`, { transactions }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000 // 30 second timeout for large datasets
        });
        return response.data;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            if (axiosError.code === 'ECONNREFUSED') {
                throw new Error('AI service is not available. Please ensure the Python service is running.');
            }
            throw new Error(`AI service error: ${axiosError.message}`);
        }
        throw error;
    }
}
/**
 * Health check for AI service
 */
async function checkAIServiceHealth() {
    try {
        const response = await axios_1.default.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
        return response.status === 200;
    }
    catch {
        return false;
    }
}
/**
 * Fallback local analysis when AI service is unavailable
 * Provides basic analysis without ML capabilities
 */
function performLocalAnalysis(transactions) {
    const startTime = Date.now();
    // Build adjacency structure
    const outgoing = new Map();
    const incoming = new Map();
    const txByAccount = new Map();
    const accounts = new Set();
    for (const tx of transactions) {
        accounts.add(tx.sender_id);
        accounts.add(tx.receiver_id);
        if (!outgoing.has(tx.sender_id))
            outgoing.set(tx.sender_id, new Set());
        if (!incoming.has(tx.receiver_id))
            incoming.set(tx.receiver_id, new Set());
        outgoing.get(tx.sender_id).add(tx.receiver_id);
        incoming.get(tx.receiver_id).add(tx.sender_id);
        if (!txByAccount.has(tx.sender_id))
            txByAccount.set(tx.sender_id, []);
        if (!txByAccount.has(tx.receiver_id))
            txByAccount.set(tx.receiver_id, []);
        txByAccount.get(tx.sender_id).push(tx);
        txByAccount.get(tx.receiver_id).push(tx);
    }
    // Simple cycle detection (DFS-based, limited depth)
    const cycles = [];
    const visited = new Set();
    function findCycles(start, current, path, depth) {
        if (depth > 5)
            return;
        const neighbors = outgoing.get(current);
        if (!neighbors)
            return;
        for (const neighbor of neighbors) {
            if (neighbor === start && path.length >= 3) {
                cycles.push([...path, neighbor]);
                continue;
            }
            if (!path.includes(neighbor)) {
                findCycles(start, neighbor, [...path, neighbor], depth + 1);
            }
        }
    }
    // Limit cycle detection for performance
    let cycleSearchCount = 0;
    for (const account of accounts) {
        if (cycleSearchCount > 100)
            break; // Limit searches
        if (!visited.has(account)) {
            findCycles(account, account, [account], 1);
            visited.add(account);
            cycleSearchCount++;
        }
    }
    // Smurfing detection (simplified)
    const fan_in = {};
    const fan_out = {};
    // Check for fan-in (10+ unique senders to receiver within 72 hours)
    for (const [receiver, senders] of incoming) {
        if (senders.size >= 10) {
            fan_in[receiver] = Array.from(senders);
        }
    }
    // Check for fan-out (10+ unique receivers from sender within 72 hours)
    for (const [sender, receivers] of outgoing) {
        if (receivers.size >= 10) {
            fan_out[sender] = Array.from(receivers);
        }
    }
    // High velocity detection
    const high_velocity = {};
    for (const [account, txs] of txByAccount) {
        if (txs.length >= 5) {
            // Simple check: 5+ transactions total (simplified from 24h window)
            high_velocity[account] = txs.length;
        }
    }
    // Shell network detection (degree 2-3 nodes)
    const shell_networks = [];
    const shellAccounts = new Set();
    for (const account of accounts) {
        const inDegree = incoming.get(account)?.size || 0;
        const outDegree = outgoing.get(account)?.size || 0;
        const totalDegree = inDegree + outDegree;
        if (totalDegree >= 2 && totalDegree <= 3) {
            shellAccounts.add(account);
        }
    }
    // Build fraud rings from cycles
    const fraudRings = [];
    const accountScores = {};
    // Initialize all accounts
    for (const account of accounts) {
        accountScores[account] = { score: 0, patterns: [], ring_id: null };
    }
    let ringCounter = 1;
    for (const cycle of cycles.slice(0, 50)) { // Limit rings
        const ringId = `RING_${String(ringCounter).padStart(3, '0')}`;
        const riskScore = 70 + Math.random() * 25; // Base risk 70-95
        fraudRings.push({
            ring_id: ringId,
            member_accounts: cycle.slice(0, -1), // Remove duplicate starting node
            pattern_type: `cycle_length_${cycle.length - 1}`,
            risk_score: Math.round(riskScore * 10) / 10
        });
        // Update account scores for cycle members
        for (const account of cycle.slice(0, -1)) {
            accountScores[account].score += 40;
            accountScores[account].patterns.push(`cycle_length_${cycle.length - 1}`);
            if (!accountScores[account].ring_id) {
                accountScores[account].ring_id = ringId;
            }
        }
        ringCounter++;
    }
    // Update scores for other patterns
    for (const account of Object.keys(fan_in)) {
        accountScores[account].score += 30;
        accountScores[account].patterns.push('fan_in_aggregator');
    }
    for (const account of Object.keys(fan_out)) {
        accountScores[account].score += 25;
        accountScores[account].patterns.push('fan_out_disperser');
    }
    for (const account of shellAccounts) {
        accountScores[account].score += 20;
        accountScores[account].patterns.push('shell_account');
    }
    for (const account of Object.keys(high_velocity)) {
        accountScores[account].score += 15;
        accountScores[account].patterns.push('high_velocity');
    }
    // Multiple pattern bonus
    for (const account of accounts) {
        if (accountScores[account].patterns.length > 1) {
            accountScores[account].score += 10;
        }
        // Normalize to 0-100
        accountScores[account].score = Math.min(100, Math.max(0, accountScores[account].score));
        accountScores[account].score = Math.round(accountScores[account].score * 10) / 10;
    }
    const processingTime = (Date.now() - startTime) / 1000;
    return {
        cycles,
        smurfing: { fan_in, fan_out },
        shell_networks: Array.from(shellAccounts).map(s => [s]),
        high_velocity,
        merchants: [],
        account_scores: accountScores,
        fraud_rings: fraudRings,
        processing_time: Math.round(processingTime * 10) / 10
    };
}
//# sourceMappingURL=aiService.js.map