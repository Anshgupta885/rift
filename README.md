# Graph-Based Financial Crime Detection Engine

A production-ready web application for detecting money muling patterns, smurfing, and shell network structures in financial transaction data using advanced graph analysis algorithms.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-18%2B-green.svg)
![Python](https://img.shields.io/badge/python-3.11%2B-blue.svg)

## Live Demo

🔗 **[Live Demo URL]** - *Coming Soon*

---

## Tech Stack

### Backend (Node.js + Express)
- **Express.js** - RESTful API framework
- **MongoDB** - Document database for persistence
- **Mongoose** - ODM for MongoDB
- **Multer** - File upload handling
- **TypeScript** - Type-safe JavaScript

### AI Service (Python)
- **FastAPI** - High-performance async API framework
- **NetworkX** - Graph analysis library
- **Pandas** - Data manipulation
- **NumPy** - Numerical computing
- **Uvicorn** - ASGI server

### Frontend (React)
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Utility-first CSS
- **Cytoscape.js** - Graph visualization
- **Axios** - HTTP client

---

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│ Express Backend │────▶│  Python AI      │
│  (Vite + TS)    │     │ (Node.js)       │     │  Service        │
│                 │     │                 │     │  (FastAPI)      │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │    MongoDB      │
                        │                 │
                        └─────────────────┘
```

### Data Flow

1. **CSV Upload** → Frontend validates and sends to Express backend
2. **Parsing** → Backend parses CSV, validates schema
3. **AI Analysis** → Backend sends transactions to Python AI service
4. **Graph Building** → NetworkX constructs directed transaction graph
5. **Pattern Detection** → Algorithms detect cycles, smurfing, shells
6. **Scoring** → Suspicion scores calculated per account
7. **Response** → Results returned through Express to Frontend
8. **Visualization** → Cytoscape.js renders interactive graph

---

## Algorithm Approach

### 1. Cycle Detection (Money Laundering)
- **Algorithm**: Johnson's algorithm via `nx.simple_cycles()`
- **Parameters**: Length 3-5 nodes
- **Complexity**: O(V + E)(C + 1) where C = number of cycles
- **Optimization**: Length bound limits search space

### 2. Smurfing Detection (Structuring)
- **Fan-In**: Account receiving from 10+ unique senders within 72 hours
- **Fan-Out**: Account sending to 10+ unique receivers within 72 hours
- **Algorithm**: Sliding window with hash map
- **Complexity**: O(N log N) per account group

### 3. Shell Network Detection
- **Criteria**: Nodes with degree 2-3 (limited connections)
- **Path Finding**: BFS with depth limit of 5
- **Pattern**: Paths ≥3 hops through shell intermediaries
- **Complexity**: O(V × d^k) where d=avg degree, k=max depth

---

## Suspicion Score Methodology

### Weighted Scoring Model

| Pattern | Points |
|---------|--------|
| Cycle participation | +40 |
| Fan-in aggregator | +30 |
| Fan-out disperser | +25 |
| Shell account | +20 |
| High velocity (5+ tx/24h) | +15 |
| Multiple patterns bonus | +10 |

### Score Normalization
- Maximum score: 100
- Minimum score: 0
- Rounding: 1 decimal place

### False Positive Reduction
- **Merchant Detection**: High incoming volume with many unique senders
- **Reduction Factor**: 50% for identified merchants

---

## False Positive Control Strategy

1. **Merchant Pattern Recognition**
   - Accounts with 20+ transactions and 10+ unique senders flagged as merchants
   - Suspicion score reduced by 50%

2. **Multi-Pattern Requirement**
   - Single pattern flags generate lower scores
   - Bonus points only for multiple pattern detection

3. **Velocity Context**
   - High velocity alone insufficient for high scores
   - Must combine with structural patterns

4. **Ring Membership Verification**
   - Cycles must be closed loops
   - All members must have transaction evidence

---

## Installation Guide

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB 6.0+ (optional, works without)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/fraud-detection-engine.git
cd fraud-detection-engine
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. AI Service Setup
```bash
cd ai-service
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 5. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- AI Service: http://localhost:8000

---

## Deployment Instructions

### Docker Deployment

```bash
# Build and run all services
docker-compose up -d
```

### Environment Variables

#### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fraud-detection
AI_SERVICE_URL=http://localhost:8000
NODE_ENV=production
```

#### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

### Production Build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
# Serve dist/ with nginx or similar

# AI Service
cd ai-service && uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## CSV Input Format

The application accepts CSV files with the following **exact** columns:

| Column | Type | Format | Example |
|--------|------|--------|---------|
| transaction_id | String | Any | TXN_001 |
| sender_id | String | Any | ACC_00123 |
| receiver_id | String | Any | ACC_00456 |
| amount | Float | Positive | 1500.00 |
| timestamp | DateTime | YYYY-MM-DD HH:MM:SS | 2024-01-15 14:30:00 |

### Sample CSV
```csv
transaction_id,sender_id,receiver_id,amount,timestamp
TXN_001,ACC_001,ACC_002,1000.00,2024-01-15 10:00:00
TXN_002,ACC_002,ACC_003,950.00,2024-01-15 10:30:00
TXN_003,ACC_003,ACC_001,900.00,2024-01-15 11:00:00
```

---

## JSON Output Format

```json
{
  "suspicious_accounts": [
    {
      "account_id": "ACC_00123",
      "suspicion_score": 87.5,
      "detected_patterns": ["cycle_length_3", "high_velocity"],
      "ring_id": "RING_001"
    }
  ],
  "fraud_rings": [
    {
      "ring_id": "RING_001",
      "member_accounts": ["ACC_001", "ACC_002", "ACC_003"],
      "pattern_type": "cycle_length_3",
      "risk_score": 95.3
    }
  ],
  "summary": {
    "total_accounts_analyzed": 500,
    "suspicious_accounts_flagged": 15,
    "fraud_rings_detected": 4,
    "processing_time_seconds": 2.3
  }
}
```

---

## Performance

| Metric | Target | Achieved |
|--------|--------|----------|
| Max transactions | 10,000 | ✅ |
| Processing time | <30s | ✅ (~2-5s typical) |
| Cycle detection limit | Length ≤5 | ✅ |
| Memory usage | <2GB | ✅ |

### Optimizations
- Cycle detection bounded to length 5
- Sliding window for time-based patterns
- BFS depth limiting for path search
- Pandas vectorized operations
- Limited result sets (100 cycles max)

---

## Known Limitations

1. **Cycle Detection Limit**: Maximum cycle length of 5 nodes due to computational complexity
2. **Time Window Fixed**: 72-hour window for smurfing is not configurable in UI
3. **Single File Upload**: Batch processing not supported
4. **No Real-Time**: Designed for batch analysis, not streaming
5. **Graph Size**: Very large graphs (50K+ nodes) may have slower visualization
6. **No Authentication**: No user authentication implemented

---

## Future Improvements

- [ ] Real-time transaction monitoring via WebSocket
- [ ] Machine learning-based anomaly detection
- [ ] Configurable detection parameters
- [ ] Multi-file batch processing
- [ ] User authentication and role-based access
- [ ] Historical analysis and trending
- [ ] Export to PDF reports
- [ ] Integration with banking APIs
- [ ] Blockchain transaction support
- [ ] Alert notifications system

---

## API Endpoints

### POST /api/upload
Upload CSV file for analysis.

**Request**: `multipart/form-data` with `file` field

**Response**:
```json
{
  "success": true,
  "message": "Successfully processed 1000 transactions",
  "sessionId": "uuid-v4",
  "data": {
    "graph_data": { "nodes": [], "edges": [] },
    "fraud_analysis": { ... }
  }
}
```

### GET /api/analysis/:sessionId
Retrieve analysis by session ID.

### POST /api/download-json
Download analysis as JSON file.

### GET /health
Health check endpoint.

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/yourusername/fraud-detection-engine/issues) page.
"# rift" 
