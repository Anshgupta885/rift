"use strict";
/**
 * MongoDB Schema for Analysis Results
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analysis = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SuspiciousAccountSchema = new mongoose_1.Schema({
    account_id: { type: String, required: true },
    suspicion_score: { type: Number, required: true },
    detected_patterns: [{ type: String }],
    ring_id: { type: String, default: null }
}, { _id: false });
const FraudRingSchema = new mongoose_1.Schema({
    ring_id: { type: String, required: true },
    member_accounts: [{ type: String }],
    pattern_type: { type: String, required: true },
    risk_score: { type: Number, required: true }
}, { _id: false });
const SummarySchema = new mongoose_1.Schema({
    total_accounts_analyzed: { type: Number, required: true },
    suspicious_accounts_flagged: { type: Number, required: true },
    fraud_rings_detected: { type: Number, required: true },
    processing_time_seconds: { type: Number, required: true }
}, { _id: false });
const GraphNodeSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    label: { type: String, required: true },
    suspicious: { type: Boolean, default: false },
    suspicion_score: { type: Number, default: 0 },
    patterns: [{ type: String }],
    ring_id: { type: String, default: null }
}, { _id: false });
const GraphEdgeSchema = new mongoose_1.Schema({
    source: { type: String, required: true },
    target: { type: String, required: true },
    amount: { type: Number, required: true },
    timestamp: { type: String, required: true },
    transaction_id: { type: String, required: true },
    is_fraud_ring_edge: { type: Boolean, default: false }
}, { _id: false });
const AnalysisSchema = new mongoose_1.Schema({
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
    rawTransactions: [{ type: mongoose_1.Schema.Types.Mixed }]
}, {
    timestamps: true
});
exports.Analysis = mongoose_1.default.model('Analysis', AnalysisSchema);
//# sourceMappingURL=Analysis.model.js.map