/**
 * Upload Routes
 * Handles CSV file upload and processing
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseCSV } from '../utils/csvParser';
import { processTransactions } from '../services/analysisService';

const router = Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.originalname.endsWith('.csv') ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

/**
 * POST /api/upload
 * Upload CSV file and run fraud detection analysis
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a CSV file.'
      });
    }

    const fileName = req.file.originalname;
    console.log(`Processing file: ${fileName}`);

    // Parse CSV
    const parseResult = parseCSV(req.file.buffer);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error
      });
    }

    console.log(`Parsed ${parseResult.transactions.length} transactions`);

    // Process transactions
    const { sessionId, response } = await processTransactions(
      parseResult.transactions,
      fileName
    );

    return res.json({
      success: true,
      message: `Successfully processed ${parseResult.rowCount} transactions`,
      sessionId,
      data: response
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: (error as Error).message || 'Failed to process file'
    });
  }
});

export default router;
