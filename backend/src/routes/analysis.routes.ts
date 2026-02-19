/**
 * Analysis Routes
 * Handles analysis retrieval and JSON download
 */

import { Router, Request, Response } from 'express';
import { getAnalysisBySession, formatForDownload } from '../services/analysisService';

const router = Router();

// In-memory storage for last analysis (for systems without MongoDB)
let lastAnalysisResponse: any = null;
let lastSessionId: string | null = null;

/**
 * Store analysis in memory for download
 */
export function storeLastAnalysis(sessionId: string, response: any): void {
  lastSessionId = sessionId;
  lastAnalysisResponse = response;
}

/**
 * GET /api/analysis/:sessionId
 * Get analysis results by session ID
 */
router.get('/analysis/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Try MongoDB first
    const analysis = await getAnalysisBySession(sessionId);
    
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

  } catch (error) {
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
router.get('/download-json/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Try MongoDB first
    const analysis = await getAnalysisBySession(sessionId);
    
    let downloadData: object;

    if (analysis) {
      downloadData = formatForDownload(analysis);
    } else if (sessionId === lastSessionId && lastAnalysisResponse) {
      downloadData = formatForDownload(lastAnalysisResponse);
    } else {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Set headers for JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=fraud-analysis-${sessionId}.json`);
    
    return res.send(JSON.stringify(downloadData, null, 2));

  } catch (error) {
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
router.post('/download-json', (req: Request, res: Response) => {
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

  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate download'
    });
  }
});

export default router;
