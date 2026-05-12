"""
Graph-Based Financial Crime Detection Engine
Python AI Service - FastAPI Application

This microservice provides fraud detection algorithms using NetworkX.
"""

import time
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from detection_engine import DetectionEngine
from suspicion_scorer import SuspicionScorer

app = FastAPI(
    title="Financial Crime Detection AI Service",
    description="AI-powered fraud detection using graph analysis",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for request/response
class Transaction(BaseModel):
    transaction_id: str
    sender_id: str
    receiver_id: str
    amount: float
    timestamp: str


class AnalyzeRequest(BaseModel):
    transactions: List[Transaction]


class FraudRing(BaseModel):
    ring_id: str
    member_accounts: List[str]
    pattern_type: str
    risk_score: float


class AccountScore(BaseModel):
    score: float
    patterns: List[str]
    ring_id: str | None = None


class AnalyzeResponse(BaseModel):
    cycles: List[List[str]]
    smurfing: Dict[str, Dict[str, List[str]]]
    shell_networks: List[List[str]]
    high_velocity: Dict[str, int]
    merchants: List[str]
    account_scores: Dict[str, AccountScore]
    fraud_rings: List[FraudRing]
    processing_time: float


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "ai-detection"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_transactions(request: AnalyzeRequest):
    """
    Analyze transactions for fraud patterns.
    
    Detects:
    - Circular fund routing (cycles length 3-5)
    - Smurfing (fan-in/fan-out within 72 hours)
    - Layered shell networks (3+ hop chains)
    - High velocity transactions
    
    Returns comprehensive analysis with suspicion scores.
    """
    # Use perf_counter for precise timing
    start_time = time.perf_counter()
    
    if not request.transactions:
        raise HTTPException(status_code=400, detail="No transactions provided")
    
    # Convert to list of dicts for processing
    transactions = [tx.model_dump() for tx in request.transactions]
    
    # Initialize detection engine
    engine = DetectionEngine(transactions)
    
    # Run all detection algorithms
    detection_results = engine.run_all_detections()
    
    # Calculate suspicion scores
    scorer = SuspicionScorer(
        transactions=transactions,
        cycles=detection_results["cycles"],
        fan_in=detection_results["smurfing"]["fan_in"],
        fan_out=detection_results["smurfing"]["fan_out"],
        shell_networks=detection_results["shell_networks"],
        high_velocity=detection_results["high_velocity"],
        merchants=detection_results["merchants"],
        self_loops=detection_results.get("self_loops", []),
        cycle_participants=detection_results.get("cycle_participants", [])
    )
    
    account_scores = scorer.calculate_all_scores()
    fraud_rings = scorer.build_fraud_rings(detection_results["cycles"])
    
    # Update ring_id in account scores (assigns highest-risk ring)
    for ring in fraud_rings:
        for account in ring["member_accounts"]:
            if account in account_scores:
                # Only assign if not already assigned (scorer assigned highest-risk)
                if not account_scores[account]["ring_id"]:
                    account_scores[account]["ring_id"] = ring["ring_id"]
    
    # Calculate processing time in seconds with precision
    processing_time = round(time.perf_counter() - start_time, 4)
    
    return AnalyzeResponse(
        cycles=detection_results["cycles"],
        smurfing=detection_results["smurfing"],
        shell_networks=detection_results["shell_networks"],
        high_velocity=detection_results["high_velocity"],
        merchants=detection_results["merchants"],
        account_scores=account_scores,
        fraud_rings=fraud_rings,
        processing_time=processing_time
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
