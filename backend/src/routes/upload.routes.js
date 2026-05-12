"use strict";
/**
 * Upload Routes
 * Handles CSV file upload and processing
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const csvParser_1 = require("../utils/csvParser");
const analysisService_1 = require("../services/analysisService");
const router = (0, express_1.Router)();
// Configure multer for file upload
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' ||
            file.originalname.endsWith('.csv') ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        }
        else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});
/**
 * POST /api/upload
 * Upload CSV file and run fraud detection analysis
 */
router.post('/upload', upload.single('file'), async (req, res) => {
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
        const parseResult = (0, csvParser_1.parseCSV)(req.file.buffer);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                message: parseResult.error
            });
        }
        console.log(`Parsed ${parseResult.transactions.length} transactions`);
        // Process transactions
        const { sessionId, response } = await (0, analysisService_1.processTransactions)(parseResult.transactions, fileName);
        return res.json({
            success: true,
            message: `Successfully processed ${parseResult.rowCount} transactions`,
            sessionId,
            data: response
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to process file'
        });
    }
});
exports.default = router;
//# sourceMappingURL=upload.routes.js.map