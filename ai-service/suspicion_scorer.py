"""
Suspicion Score Engine for Financial Crime Detection.

Implements weighted scoring model:
- Cycle participation: +40
- Fan-in aggregator: +30
- Fan-out disperser: +25
- Shell account: +20
- High velocity (5+ tx in 24h): +15
- Multiple patterns: +10 bonus

Score normalized between 0-100.
"""

from typing import List, Dict, Set
from collections import defaultdict


class SuspicionScorer:
    """
    Calculates suspicion scores for accounts based on detected patterns.
    
    Implements weighted scoring with false positive reduction for merchants.
    """
    
    # Score weights
    WEIGHTS = {
        "cycle": 40,
        "fan_in": 30,
        "fan_out": 25,
        "shell": 20,
        "high_velocity": 15,
        "multi_pattern_bonus": 10
    }
    
    # Reduction factors
    REDUCTIONS = {
        "merchant": 0.5,  # Reduce score by 50% for merchant patterns
    }
    
    def __init__(
        self,
        transactions: List[Dict],
        cycles: List[List[str]],
        fan_in: Dict[str, List[str]],
        fan_out: Dict[str, List[str]],
        shell_networks: List[List[str]],
        high_velocity: Dict[str, int],
        merchants: List[str]
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
        """
        self.transactions = transactions
        self.cycles = cycles
        self.fan_in = fan_in
        self.fan_out = fan_out
        self.shell_networks = shell_networks
        self.high_velocity = high_velocity
        self.merchants = set(merchants)
        
        # Collect all unique accounts
        self.all_accounts: Set[str] = set()
        for tx in transactions:
            self.all_accounts.add(tx["sender_id"])
            self.all_accounts.add(tx["receiver_id"])
        
        # Track patterns per account
        self.account_patterns: Dict[str, List[str]] = defaultdict(list)
        self.account_ring_ids: Dict[str, str] = {}
        
    def calculate_all_scores(self) -> Dict[str, Dict]:
        """
        Calculate suspicion scores for all accounts.
        
        Returns:
            Dictionary mapping account_id to score data
        """
        scores: Dict[str, float] = defaultdict(float)
        
        # Process cycle participation
        ring_counter = 1
        for cycle in self.cycles:
            ring_id = f"RING_{str(ring_counter).padStart(3, '0') if hasattr(str, 'padStart') else str(ring_counter).zfill(3)}"
            cycle_length = len(cycle)
            pattern_name = f"cycle_length_{cycle_length}"
            
            for account in cycle:
                scores[account] += self.WEIGHTS["cycle"]
                self.account_patterns[account].append(pattern_name)
                
                if account not in self.account_ring_ids:
                    self.account_ring_ids[account] = ring_id
            
            ring_counter += 1
        
        # Process fan-in aggregators
        for account in self.fan_in:
            scores[account] += self.WEIGHTS["fan_in"]
            self.account_patterns[account].append("fan_in_aggregator")
        
        # Process fan-out dispersers
        for account in self.fan_out:
            scores[account] += self.WEIGHTS["fan_out"]
            self.account_patterns[account].append("fan_out_disperser")
        
        # Process shell network accounts
        shell_accounts: Set[str] = set()
        for path in self.shell_networks:
            # Middle nodes in path are shell accounts
            for node in path[1:-1]:
                shell_accounts.add(node)
        
        for account in shell_accounts:
            scores[account] += self.WEIGHTS["shell"]
            self.account_patterns[account].append("shell_account")
        
        # Process high velocity accounts
        for account in self.high_velocity:
            scores[account] += self.WEIGHTS["high_velocity"]
            self.account_patterns[account].append("high_velocity")
        
        # Apply multiple pattern bonus
        for account in self.all_accounts:
            if len(self.account_patterns[account]) > 1:
                scores[account] += self.WEIGHTS["multi_pattern_bonus"]
        
        # Apply merchant reduction
        for account in self.merchants:
            if account in scores:
                scores[account] *= self.REDUCTIONS["merchant"]
        
        # Normalize scores to 0-100 and build result
        result: Dict[str, Dict] = {}
        
        for account in self.all_accounts:
            score = min(100, max(0, scores[account]))
            score = round(score, 1)
            
            result[account] = {
                "score": score,
                "patterns": list(set(self.account_patterns[account])),  # Dedupe
                "ring_id": self.account_ring_ids.get(account)
            }
        
        return result
    
    def build_fraud_rings(self, cycles: List[List[str]]) -> List[Dict]:
        """
        Build fraud ring structures from detected cycles.
        
        Args:
            cycles: List of detected cycles
            
        Returns:
            List of fraud ring dictionaries
        """
        fraud_rings: List[Dict] = []
        
        for i, cycle in enumerate(cycles):
            ring_id = f"RING_{str(i + 1).zfill(3)}"
            cycle_length = len(cycle)
            
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
                1 for m in cycle if len(self.account_patterns.get(m, [])) > 1
            )
            
            if members_with_multi_patterns > 0:
                base_risk += min(10, members_with_multi_patterns * 2)
            
            risk_score = min(100, base_risk)
            risk_score = round(risk_score, 1)
            
            fraud_rings.append({
                "ring_id": ring_id,
                "member_accounts": cycle,
                "pattern_type": f"cycle_length_{cycle_length}",
                "risk_score": risk_score
            })
        
        # Sort by risk score descending
        fraud_rings.sort(key=lambda x: x["risk_score"], reverse=True)
        
        return fraud_rings
