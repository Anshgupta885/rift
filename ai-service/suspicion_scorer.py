"""
Suspicion Score Engine for Financial Crime Detection.

Implements weighted scoring model with diminishing returns:
- Cycle participation: 35, with +3 incremental bonus for additional cycles
- Fan-in aggregator: 20
- Fan-out disperser: 18
- Shell account: 15
- High velocity (5+ tx in 24h): 10

Score capped at 95 to prevent saturation.
Accounts without validated ring participation are capped at 60.
Merchant accounts receive 70% score reduction.
"""

import math
from typing import List, Dict, Set, Tuple
from collections import defaultdict


class SuspicionScorer:
    """
    Calculates suspicion scores for accounts based on detected patterns.
    
    Implements weighted scoring with diminishing returns and false positive reduction.
    """
    
    # Score weights with diminishing returns (conservative to reduce false positives)
    WEIGHTS = {
        "cycle": 35,               # First cycle participation (reduced from 40)
        "cycle_additional": 3,      # Small incremental bonus per additional cycle
        "fan_in": 20,              # Reduced from 25
        "fan_out": 18,             # Reduced from 20
        "shell": 15,
        "high_velocity": 10,
        "multi_pattern_bonus": 3    # Small bonus for multiple patterns
    }
    
    # Reduction factors
    REDUCTIONS = {
        "merchant": 0.3,  # Reduce score by 70% for merchant patterns (stricter)
    }
    
    # Score caps
    MAX_SCORE = 95              # Overall maximum score
    NO_RING_CAP = 60           # Cap for accounts without validated ring participation
    
    def __init__(
        self,
        transactions: List[Dict],
        cycles: List[List[str]],
        fan_in: Dict[str, List[str]],
        fan_out: Dict[str, List[str]],
        shell_networks: List[List[str]],
        high_velocity: Dict[str, int],
        merchants: List[str],
        self_loops: List[str] = None,
        cycle_participants: List[str] = None
    ):
        """
        Initialize scorer with detection results.
        
        Args:
            transactions: List of transaction dictionaries
            cycles: List of detected cycles
            fan_in: Fan-in pattern results
            fan_out: Fan-out pattern results
            shell_networks: Detected shell network paths
            high_velocity: High velocity accounts
            merchants: Identified merchant accounts
            self_loops: Accounts with self-loop transactions (anomaly)
            cycle_participants: Accounts that participate in any cycle
        """
        self.transactions = transactions
        self.cycles = cycles
        self.fan_in = fan_in
        self.fan_out = fan_out
        self.shell_networks = shell_networks
        self.high_velocity = high_velocity
        self.merchants = set(merchants)
        self.self_loops = set(self_loops or [])
        self.cycle_participants = set(cycle_participants or [])
        
        # Collect all unique accounts
        self.all_accounts: Set[str] = set()
        for tx in transactions:
            self.all_accounts.add(tx["sender_id"])
            self.all_accounts.add(tx["receiver_id"])
        
        # Track patterns per account (using sets to avoid duplicates)
        self.account_patterns: Dict[str, Set[str]] = defaultdict(set)
        self.account_ring_ids: Dict[str, str] = {}
        self.account_cycle_count: Dict[str, int] = defaultdict(int)
        
        # Track ring risk scores for assigning highest-risk ring
        self.ring_risk_scores: Dict[str, float] = {}
        
    def calculate_all_scores(self) -> Dict[str, Dict]:
        """
        Calculate suspicion scores for all accounts.
        
        Uses capped weighted scoring with boolean cycle participation.
        Accounts without validated ring participation are capped at 60.
        Final score capped at 95.
        
        Ring IDs are only assigned for validated laundering cycles.
        
        Returns:
            Dictionary mapping account_id to score data
        """
        scores: Dict[str, float] = defaultdict(float)

        # First pass: assign accounts to highest-risk rings
        # Ring IDs are ONLY created for validated laundering cycles
        ring_counter = 1
        for cycle in self.cycles:
            ring_id = f"RING_{str(ring_counter).zfill(3)}"
            cycle_length = len(cycle)
            
            base_risk = 70
            if cycle_length == 3: base_risk += 15
            elif cycle_length == 4: base_risk += 10
            elif cycle_length == 5: base_risk += 5
            
            self.ring_risk_scores[ring_id] = base_risk

            for account in cycle:
                # Assign highest-risk ring only
                current_ring = self.account_ring_ids.get(account)
                if current_ring is None:
                    self.account_ring_ids[account] = ring_id
                else:
                    # Compare risk scores and keep the highest
                    current_risk = self.ring_risk_scores.get(current_ring, 0)
                    if base_risk > current_risk:
                        self.account_ring_ids[account] = ring_id

            ring_counter += 1

        # Process cycle participation with boolean logic (no counting)
        for account in self.cycle_participants:
            scores[account] += self.WEIGHTS["cycle"]
            self.account_patterns[account].add("cycle_participant")
        
        # Process fan-in aggregators
        for account in self.fan_in:
            scores[account] += self.WEIGHTS["fan_in"]
            self.account_patterns[account].add("fan_in_aggregator")
        
        # Process fan-out dispersers
        for account in self.fan_out:
            scores[account] += self.WEIGHTS["fan_out"]
            self.account_patterns[account].add("fan_out_disperser")
        
        # Process shell network accounts (exclude self-loops)
        shell_accounts: Set[str] = set()
        for path in self.shell_networks:
            # Middle nodes in path are shell accounts
            for node in path[1:-1]:
                # Don't flag self-loop accounts as shell accounts
                if node not in self.self_loops:
                    shell_accounts.add(node)
        
        for account in shell_accounts:
            scores[account] += self.WEIGHTS["shell"]
            self.account_patterns[account].add("shell_account")
        
        # Process high velocity accounts
        for account in self.high_velocity:
            scores[account] += self.WEIGHTS["high_velocity"]
            self.account_patterns[account].add("high_velocity")
        
        # Process self-loops as anomaly (not fraud)
        for account in self.self_loops:
            self.account_patterns[account].add("self_loop_anomaly")
            # Small score for anomaly, but not indicative of fraud
            scores[account] += 2
        
        # Apply multiple pattern bonus (conservative)
        for account in self.all_accounts:
            pattern_count = len(self.account_patterns[account])
            if pattern_count > 1:
                # Small fixed bonus for multiple patterns
                bonus = self.WEIGHTS["multi_pattern_bonus"] * (pattern_count - 1)
                scores[account] += min(bonus, 6)  # Cap multi-pattern bonus at +6
        
        # Apply merchant reduction (70% reduction)
        for account in self.merchants:
            if account in scores:
                scores[account] *= self.REDUCTIONS["merchant"]
        
        # Build result with proper capping and deduplication
        result: Dict[str, Dict] = {}
        
        for account in self.all_accounts:
            score = scores[account]
            
            # Cap accounts without validated ring participation at 60
            has_ring = account in self.account_ring_ids
            if not has_ring:
                score = min(score, self.NO_RING_CAP)
            
            # Apply overall max score cap
            score = min(score, self.MAX_SCORE)
            score = max(0, score)
            score = round(score, 1)
            
            # Convert pattern set to sorted list for consistent output
            patterns = sorted(list(self.account_patterns[account]))
            
            result[account] = {
                "score": score,
                "patterns": patterns,  # Already deduplicated via set
                "ring_id": self.account_ring_ids.get(account)
            }
        
        return result
    
    def build_fraud_rings(self, cycles: List[List[str]]) -> List[Dict]:
        """
        Build fraud ring structures from VALIDATED laundering cycles only.
        
        Rings are created ONLY when laundering cycle validation passes.
        Weak cycles that don't meet strict validation criteria are not included.
        
        Cycles are already canonicalized, deduplicated, and validated by detection_engine.
        
        Args:
            cycles: List of validated laundering cycles (already filtered)
            
        Returns:
            List of fraud ring dictionaries, sorted by risk score descending
        """
        fraud_rings: List[Dict] = []
        seen_ring_members: Set[Tuple[str, ...]] = set()
        
        for i, cycle in enumerate(cycles):
            ring_id = f"RING_{str(i + 1).zfill(3)}"
            cycle_length = len(cycle)
            
            # Create a canonical tuple for deduplication check
            cycle_tuple = tuple(sorted(cycle))
            if cycle_tuple in seen_ring_members:
                continue
            seen_ring_members.add(cycle_tuple)
            
            # Calculate risk score based on cycle properties
            base_risk = 70
            
            # Shorter cycles are more suspicious
            if cycle_length == 3:
                base_risk += 15
            elif cycle_length == 4:
                base_risk += 10
            elif cycle_length == 5:
                base_risk += 5
            
            # Check if members have other patterns
            members_with_multi_patterns = sum(
                1 for m in cycle if len(self.account_patterns.get(m, set())) > 1
            )
            
            if members_with_multi_patterns > 0:
                base_risk += min(10, members_with_multi_patterns * 2)
            
            # Cap risk score at 95 to prevent saturation
            risk_score = min(self.MAX_SCORE, base_risk)
            risk_score = round(risk_score, 1)
            
            fraud_rings.append({
                "ring_id": ring_id,
                "member_accounts": list(cycle),
                "pattern_type": f"cycle_length_{cycle_length}",
                "risk_score": risk_score
            })
        
        # Sort by risk score descending
        fraud_rings.sort(key=lambda x: x["risk_score"], reverse=True)
        
        return fraud_rings
