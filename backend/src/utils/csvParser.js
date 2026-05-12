"use strict";
/**
 * CSV Parser and Validator Utility
 * Validates strict CSV schema and parses transactions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateColumns = validateColumns;
exports.validateTimestamp = validateTimestamp;
exports.parseCSV = parseCSV;
exports.buildGraphData = buildGraphData;
const sync_1 = require("csv-parse/sync");
// Required columns in exact order
const REQUIRED_COLUMNS = [
    'transaction_id',
    'sender_id',
    'receiver_id',
    'amount',
    'timestamp'
];
/**
 * Validate CSV columns match required schema
 */
function validateColumns(headers) {
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
    for (const col of REQUIRED_COLUMNS) {
        if (!normalizedHeaders.includes(col)) {
            return {
                valid: false,
                error: `Missing required column: ${col}. Required columns: ${REQUIRED_COLUMNS.join(', ')}`
            };
        }
    }
    return { valid: true };
}
/**
 * Validate timestamp format (YYYY-MM-DD HH:MM:SS)
 */
function validateTimestamp(timestamp) {
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!regex.test(timestamp)) {
        return false;
    }
    const date = new Date(timestamp.replace(' ', 'T'));
    return !isNaN(date.getTime());
}
/**
 * Parse and validate CSV content
 */
function parseCSV(content) {
    try {
        const records = (0, sync_1.parse)(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });
        if (records.length === 0) {
            return {
                success: false,
                transactions: [],
                error: 'CSV file is empty'
            };
        }
        // Validate headers
        const headers = Object.keys(records[0]);
        const headerValidation = validateColumns(headers);
        if (!headerValidation.valid) {
            return {
                success: false,
                transactions: [],
                error: headerValidation.error
            };
        }
        // Parse and validate each row
        const transactions = [];
        const errors = [];
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNum = i + 2; // Account for header row (1-indexed)
            // Validate required fields
            if (!row.transaction_id || !row.sender_id || !row.receiver_id) {
                errors.push(`Row ${rowNum}: Missing required field(s)`);
                continue;
            }
            // Validate amount
            const amount = parseFloat(row.amount);
            if (isNaN(amount) || amount < 0) {
                errors.push(`Row ${rowNum}: Invalid amount value`);
                continue;
            }
            // Validate timestamp
            if (!validateTimestamp(row.timestamp)) {
                errors.push(`Row ${rowNum}: Invalid timestamp format. Expected: YYYY-MM-DD HH:MM:SS`);
                continue;
            }
            transactions.push({
                transaction_id: row.transaction_id.trim(),
                sender_id: row.sender_id.trim(),
                receiver_id: row.receiver_id.trim(),
                amount: Math.round(amount * 100) / 100, // Round to 2 decimals
                timestamp: row.timestamp.trim()
            });
        }
        if (errors.length > 0 && transactions.length === 0) {
            return {
                success: false,
                transactions: [],
                error: `All rows failed validation: ${errors.slice(0, 5).join('; ')}`
            };
        }
        return {
            success: true,
            transactions,
            rowCount: transactions.length
        };
    }
    catch (error) {
        return {
            success: false,
            transactions: [],
            error: `CSV parsing error: ${error.message}`
        };
    }
}
/**
 * Build graph structure from transactions
 */
function buildGraphData(transactions, accountScores, fraudRingEdges) {
    const nodeMap = new Map();
    // Collect unique nodes
    for (const tx of transactions) {
        if (!nodeMap.has(tx.sender_id)) {
            nodeMap.set(tx.sender_id, { id: tx.sender_id, txCount: 0 });
        }
        if (!nodeMap.has(tx.receiver_id)) {
            nodeMap.set(tx.receiver_id, { id: tx.receiver_id, txCount: 0 });
        }
        nodeMap.get(tx.sender_id).txCount++;
        nodeMap.get(tx.receiver_id).txCount++;
    }
    // Build nodes
    const nodes = Array.from(nodeMap.values()).map(node => {
        const scoreData = accountScores[node.id] || { score: 0, patterns: [], ring_id: null };
        return {
            id: node.id,
            label: node.id,
            suspicious: scoreData.score > 50,
            suspicion_score: Math.round(scoreData.score * 10) / 10,
            patterns: scoreData.patterns,
            ring_id: scoreData.ring_id
        };
    });
    // Build edges
    const edges = transactions.map(tx => ({
        source: tx.sender_id,
        target: tx.receiver_id,
        amount: tx.amount,
        timestamp: tx.timestamp,
        transaction_id: tx.transaction_id,
        is_fraud_ring_edge: fraudRingEdges.has(`${tx.sender_id}-${tx.receiver_id}`)
    }));
    return { nodes, edges };
}
//# sourceMappingURL=csvParser.js.map