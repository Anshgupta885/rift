"use strict";
/**
 * Analysis Routes
 * Handles analysis retrieval and JSON download
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeLastAnalysis = storeLastAnalysis;
const express_1 = require("express");
const analysisService_1 = require("../services/analysisService");
const router = (0, express_1.Router)();
// In-memory storage for last analysis (for systems without MongoDB)
let lastAnalysisResponse = null;
let lastSessionId = null;
/**
 * Store analysis in memory for download
 */
function storeLastAnalysis(sessionId, response) {
    lastSessionId = sessionId;
    lastAnalysisResponse = response;
}
/**
 * GET /api/analysis/:sessionId
 * Get analysis results by session ID
 */
router.get('/analysis/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        // Try MongoDB first
        const analysis = await (0, analysisService_1.getAnalysisBySession)(sessionId);
        if (analysis) {
            return res.json({
                success: true,
                data: analysis
            });
        }
        // Fallback to in-memory
        if (sessionId === lastSessionId && lastAnalysisResponse) {
            return res.json({
                success: true,
                data: lastAnalysisResponse
            });
        }
        return res.status(404).json({
            success: false,
            message: 'Analysis not found'
        });
    }
    catch (error) {
        console.error('Analysis retrieval error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve analysis'
        });
    }
});
/**
 * GET /api/download-json/:sessionId
 * Download analysis as JSON file
 */
router.get('/download-json/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        // Try MongoDB first
        const analysis = await (0, analysisService_1.getAnalysisBySession)(sessionId);
        let downloadData;
        if (analysis) {
            downloadData = (0, analysisService_1.formatForDownload)(analysis);
        }
        else if (sessionId === lastSessionId && lastAnalysisResponse) {
            downloadData = (0, analysisService_1.formatForDownload)(lastAnalysisResponse);
        }
        else {
            return res.status(404).json({
                success: false,
                message: 'Analysis not found'
            });
        }
        // Set headers for JSON download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=fraud-analysis-${sessionId}.json`);
        return res.send(JSON.stringify(downloadData, null, 2));
    }
    catch (error) {
        console.error('Download error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate download'
        });
    }
});
/**
 * POST /api/download-json
 * Download analysis directly from request body
 */
router.post('/download-json', (req, res) => {
    try {
        const { fraud_analysis } = req.body;
        if (!fraud_analysis) {
            return res.status(400).json({
                success: false,
                message: 'No analysis data provided'
            });
        }
        const downloadData = {
            suspicious_accounts: fraud_analysis.suspicious_accounts,
            fraud_rings: fraud_analysis.fraud_rings,
            summary: fraud_analysis.summary
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=fraud-analysis.json');
        return res.send(JSON.stringify(downloadData, null, 2));
    }
    catch (error) {
        console.error('Download error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate download'
        });
    }
});
exports.default = router;
//# sourceMappingURL=analysis.routes.js.map