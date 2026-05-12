"""
Detection Engine for Financial Crime Patterns.

Implements three core detection algorithms:
1. Cycle Detection - Circular fund routing (money laundering)
2. Smurfing Detection - Fan-in/Fan-out patterns (structuring)
3. Shell Network Detection - Layered intermediary chains

Performance optimized for 10K+ transactions.
"""

import networkx as nx
import pandas as pd
from typing import List, Dict, Set, Tuple, Optional
from datetime import timedelta, datetime
from collections import defaultdict


class DetectionEngine:
    """
    Core detection engine for identifying money muling patterns.
    
    Detects:
    - Circular fund routing (cycles length 3-5)
    - Smurfing (fan-in/fan-out within 72 hours)
    - Layered shell networks (3+ hop chains with low-degree intermediates)
    """
    
    def __init__(self, transactions: List[Dict]):
        """
        Initialize detection engine.
        
        Args:
            transactions: List of transaction dictionaries
        """
        self.transactions = transactions
        self.df = pd.DataFrame(transactions)
        self.graph = self._build_graph()
        
    def _build_graph(self) -> nx.DiGraph:
        """Build NetworkX directed graph from transactions, excluding self-loops."""
        G = nx.DiGraph()
        
        for tx in self.transactions:
            sender = tx["sender_id"]
            receiver = tx["receiver_id"]
            
            # Skip self-loops - these are anomalies but not fraud patterns
            if sender == receiver:
                continue
            
            # Add nodes
            if not G.has_node(sender):
                G.add_node(sender)
            if not G.has_node(receiver):
                G.add_node(receiver)
            
            # Add edge with attributes (store as list for multiple transactions)
            if G.has_edge(sender, receiver):
                # Append to existing edge data
                G[sender][receiver]['transactions'].append({
                    'amount': tx["amount"],
                    'timestamp': tx["timestamp"],
                    'transaction_id': tx["transaction_id"]
                })
            else:
                G.add_edge(
                    sender,
                    receiver,
                    transactions=[{
                        'amount': tx["amount"],
                        'timestamp': tx["timestamp"],
                        'transaction_id': tx["transaction_id"]
                    }]
                )
        
        return G
    
    def _get_self_loops(self) -> Set[str]:
        """Identify accounts with self-loop transactions (anomaly, not fraud)."""
        self_loops = set()
        for tx in self.transactions:
            if tx["sender_id"] == tx["receiver_id"]:
                self_loops.add(tx["sender_id"])
        return self_loops
    
    def run_all_detections(self) -> Dict:
        """
        Execute all detection algorithms and return comprehensive results.
        
        Returns:
            Dictionary containing all detected patterns
        """
        cycles = self.detect_cycles()
        
        # Collect accounts participating in cycles
        cycle_participants = set()
        for cycle in cycles:
            cycle_participants.update(cycle)
        
        fan_in, fan_out = self.detect_smurfing(cycle_participants=cycle_participants)
        shells = self.detect_shell_networks()
        high_velocity = self.get_high_velocity_accounts()
        merchants = self.identify_merchant_patterns(cycle_participants=cycle_participants)
        self_loops = self._get_self_loops()
        
        return {
            "cycles": cycles,
            "smurfing": {
                "fan_in": fan_in,
                "fan_out": fan_out
            },
            "shell_networks": shells,
            "high_velocity": high_velocity,
            "merchants": list(merchants),
            "self_loops": list(self_loops),
            "cycle_participants": list(cycle_participants)
        }
    
    def detect_cycles(self, min_length: int = 3, max_length: int = 5) -> List[List[str]]:
        """
        Detect circular fund routing patterns (money laundering).
        
        Does NOT use raw nx.simple_cycles as fraud evidence.
        Instead:
        1. Generates cycles length 3-5
        2. Canonicalizes cycles (rotate smallest node first)
        3. Deduplicates using set
        4. Applies strict laundering validation
        
        A cycle is suspicious ONLY if ALL conditions hold:
        - Timestamps across edges within 48 hours
        - Transaction amounts within ±20%
        - Money returns close to origin amount
        - At least one intermediate node has degree <= 3
        
        Discards all cycles that don't meet these criteria.
        
        Args:
            min_length: Minimum cycle length (default 3)
            max_length: Maximum cycle length (default 5)
            
        Returns:
            List of validated laundering cycles only
        """
        seen_cycles: Set[Tuple[str, ...]] = set()
        valid_cycles: List[List[str]] = []
        
        try:
            # Use simple_cycles with length_bound for performance
            for cycle in nx.simple_cycles(self.graph, length_bound=max_length):
                if min_length <= len(cycle) <= max_length:
                    # Canonicalize: rotate so smallest account_id is first
                    canonical = self._canonicalize_cycle(cycle)
                    
                    if canonical not in seen_cycles:
                        seen_cycles.add(canonical)
                        
                        # Apply constraint filtering
                        if self._is_valid_fraud_cycle(list(canonical)):
                            valid_cycles.append(list(canonical))
                    
                # Limit to 100 cycles for performance
                if len(valid_cycles) >= 100:
                    break
                    
        except nx.NetworkXError:
            pass
        
        return valid_cycles
    
    def _canonicalize_cycle(self, cycle: List[str]) -> Tuple[str, ...]:
        """
        Canonicalize a cycle by rotating so smallest account_id is first.
        
        This ensures the same cycle with different rotations is recognized
        as the same ring.
        """
        if not cycle:
            return tuple()
        
        # Find the index of the smallest account_id
        min_idx = 0
        min_val = cycle[0]
        for i, account in enumerate(cycle):
            if account < min_val:
                min_val = account
                min_idx = i
        
        # Rotate the cycle so the smallest is first
        rotated = cycle[min_idx:] + cycle[:min_idx]
        return tuple(rotated)
    
    def _is_valid_fraud_cycle(self, cycle: List[str]) -> bool:
        """
        Check if a cycle meets STRICT fraud cycle constraints for laundering.
        
        A cycle is laundering ONLY if ALL conditions hold:
        - Timestamps across edges within 48 hours
        - Transaction amounts within ±20%
        - Funds return close to original amount (layering behavior)
        - At least one intermediate node has degree <= 3
        
        Discards all cycles that don't meet these criteria.
        """
        if len(cycle) < 3:
            return False
        
        # Check intermediate node degree constraint
        # At least one node must have low degree (not part of dense random graph)
        has_low_degree_intermediate = False
        for node in cycle:
            degree = self.graph.in_degree(node) + self.graph.out_degree(node)
            if degree <= 3:
                has_low_degree_intermediate = True
                break
        
        if not has_low_degree_intermediate:
            return False
        
        # Collect edge data for the cycle
        edge_data: List[Dict] = []
        for i in range(len(cycle)):
            sender = cycle[i]
            receiver = cycle[(i + 1) % len(cycle)]
            
            if self.graph.has_edge(sender, receiver):
                edge_info = self.graph[sender][receiver]
                transactions = edge_info.get('transactions', [])
                if transactions:
                    # Use the most recent transaction for timing
                    edge_data.append(transactions[-1])
                else:
                    # Fallback for old edge format
                    edge_data.append({
                        'amount': edge_info.get('amount', 0),
                        'timestamp': edge_info.get('timestamp', '')
                    })
            else:
                return False  # Edge doesn't exist
        
        if len(edge_data) < len(cycle):
            return False
        
        # Check timestamp constraint: all edges within 48 hours
        try:
            timestamps = []
            for ed in edge_data:
                ts = pd.to_datetime(ed['timestamp'])
                timestamps.append(ts)
            
            if timestamps:
                min_ts = min(timestamps)
                max_ts = max(timestamps)
                if (max_ts - min_ts) > timedelta(hours=48):
                    return False
        except (ValueError, KeyError):
            return False  # Strict: reject if timestamp parsing fails
        
        # Check amount constraint: all amounts within ±20% (stricter)
        try:
            amounts = [ed['amount'] for ed in edge_data if ed.get('amount')]
            if not amounts or len(amounts) < len(cycle):
                return False  # Must have amounts for all edges
            
            avg_amount = sum(amounts) / len(amounts)
            if avg_amount <= 0:
                return False
            
            for amt in amounts:
                variance = abs(amt - avg_amount) / avg_amount
                if variance > 0.20:  # Stricter: 20% instead of 25%
                    return False
            
            # Layering behavior check: first and last amounts should be close
            # (funds return close to original amount)
            first_amount = amounts[0]
            last_amount = amounts[-1]
            if first_amount > 0:
                return_variance = abs(last_amount - first_amount) / first_amount
                if return_variance > 0.25:  # Funds should return within 25%
                    return False
                    
        except (ValueError, KeyError):
            return False  # Strict: reject if amount parsing fails
        
        return True
    
    def detect_smurfing(self, time_window_hours: int = 72, 
                        threshold: int = 10,
                        cycle_participants: Optional[Set[str]] = None) -> Tuple[Dict[str, List[str]], Dict[str, List[str]]]:
        """
        Detect smurfing patterns (structuring) with refined constraints.
        
        Fan-in is flagged only if aggregation is followed by outgoing dispersal
        within 48 hours.
        
        Fan-out is flagged only if funds originate from aggregation or cycle.
        
        Args:
            time_window_hours: Time window in hours (default 72)
            threshold: Minimum unique counterparties to flag (default 10)
            cycle_participants: Set of accounts participating in cycles
            
        Returns:
            Tuple of (fan_in_dict, fan_out_dict)
        """
        fan_in: Dict[str, List[str]] = {}
        fan_out: Dict[str, List[str]] = {}
        
        if cycle_participants is None:
            cycle_participants = set()
        
        if self.df.empty:
            return fan_in, fan_out
        
        # Convert timestamp to datetime
        df = self.df.copy()
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        time_window = timedelta(hours=time_window_hours)
        dispersal_window = timedelta(hours=48)
        
        # First pass: identify potential aggregators (fan-in candidates)
        potential_aggregators: Dict[str, Tuple[List[str], datetime, datetime]] = {}
        
        for receiver, group in df.groupby('receiver_id'):
            senders_in_window, window_start, window_end = self._get_unique_counterparties_in_window_with_timing(
                group, 'sender_id', time_window
            )
            if len(senders_in_window) >= threshold:
                potential_aggregators[receiver] = (list(senders_in_window), window_start, window_end)
        
        # Fan-in: Aggregation followed by MEANINGFUL redistribution within 48 hours
        # Fan-in alone is NOT suspicious - must be followed by dispersal
        for account, (senders, agg_start, agg_end) in potential_aggregators.items():
            # Check for outgoing transactions after aggregation
            outgoing_after = df[
                (df['sender_id'] == account) & 
                (df['timestamp'] > agg_start) &
                (df['timestamp'] <= agg_end + dispersal_window)
            ]
            
            # Must have meaningful outgoing dispersal (multiple receivers)
            if len(outgoing_after) >= 3:
                unique_receivers = outgoing_after['receiver_id'].nunique()
                # Redistribution must be to multiple parties (not just 1-2)
                if unique_receivers >= 3:
                    fan_in[account] = senders
        
        # Fan-out: suspicious ONLY if funds originate from aggregation or cycle
        # Not just degree-based heuristics
        for sender, group in df.groupby('sender_id'):
            receivers_in_window, window_start, window_end = self._get_unique_counterparties_in_window_with_timing(
                group, 'receiver_id', time_window
            )
            if len(receivers_in_window) >= threshold:
                # Check if this dispersal is preceded by aggregation or cycle participation
                is_from_aggregation = sender in potential_aggregators
                is_from_cycle = sender in cycle_participants
                
                # Check for incoming transactions before dispersal (from multiple sources)
                incoming_before = df[
                    (df['receiver_id'] == sender) & 
                    (df['timestamp'] < window_end) &
                    (df['timestamp'] >= window_start - dispersal_window)
                ]
                # Require aggregation from multiple unique senders
                unique_incoming_senders = incoming_before['sender_id'].nunique() if not incoming_before.empty else 0
                has_prior_aggregation = len(incoming_before) >= 5 and unique_incoming_senders >= 3
                
                # Only flag if clear causal link exists
                if is_from_aggregation or is_from_cycle or has_prior_aggregation:
                    fan_out[sender] = list(receivers_in_window)
        
        return fan_in, fan_out
    
    def _get_unique_counterparties_in_window_with_timing(self, group: pd.DataFrame, 
                                              counterparty_col: str,
                                              time_window: timedelta) -> Tuple[Set[str], datetime, datetime]:
        """Get maximum unique counterparties within any time window, with timing info."""
        if group.empty:
            return set(), datetime.min, datetime.min
        
        group = group.sort_values('timestamp')
        timestamps = group['timestamp'].values
        counterparties = group[counterparty_col].values
        
        max_unique: Set[str] = set()
        best_start = None
        best_end = None
        n = len(timestamps)
        
        # Sliding window approach
        left = 0
        current_window: Dict[str, int] = defaultdict(int)
        
        for right in range(n):
            current_window[counterparties[right]] += 1
            
            # Shrink window if outside time bounds
            while left < right:
                time_diff = pd.Timestamp(timestamps[right]) - pd.Timestamp(timestamps[left])
                if time_diff > time_window:
                    current_window[counterparties[left]] -= 1
                    if current_window[counterparties[left]] == 0:
                        del current_window[counterparties[left]]
                    left += 1
                else:
                    break
            
            if len(current_window) > len(max_unique):
                max_unique = set(current_window.keys())
                best_start = pd.Timestamp(timestamps[left]).to_pydatetime()
                best_end = pd.Timestamp(timestamps[right]).to_pydatetime()
        
        if best_start is None:
            best_start = datetime.min
        if best_end is None:
            best_end = datetime.min
        
        return max_unique, best_start, best_end
    
    def detect_shell_networks(self, min_path_length: int = 3,
                               degree_range: Tuple[int, int] = (2, 3)) -> List[List[str]]:
        """
        Detect layered shell network patterns.
        
        Identifies paths through low-degree intermediate nodes,
        which are typical of shell company layering structures.
        
        Args:
            min_path_length: Minimum path length (default 3)
            degree_range: Degree range for shell accounts (default 2-3)
            
        Returns:
            List of shell network paths
        """
        shell_paths: List[List[str]] = []
        
        # Identify potential shell accounts (low degree nodes)
        shell_candidates: Set[str] = set()
        for node in self.graph.nodes():
            degree = self.graph.in_degree(node) + self.graph.out_degree(node)
            if degree_range[0] <= degree <= degree_range[1]:
                shell_candidates.add(node)
        
        if not shell_candidates:
            return shell_paths
        
        # Find paths through shell accounts (BFS with depth limit)
        visited_paths: Set[Tuple[str, ...]] = set()
        
        for start_node in list(self.graph.nodes())[:50]:  # Limit starting nodes
            if start_node in shell_candidates:
                continue
                
            paths = self._find_paths_through_shells(
                start_node, 
                shell_candidates, 
                min_path_length,
                max_depth=5
            )
            
            for path in paths:
                path_tuple = tuple(path)
                if path_tuple not in visited_paths:
                    visited_paths.add(path_tuple)
                    shell_paths.append(path)
                    
                if len(shell_paths) >= 50:  # Limit total paths
                    return shell_paths
        
        return shell_paths
    
    def _find_paths_through_shells(self, start: str, 
                                    shell_candidates: Set[str],
                                    min_length: int,
                                    max_depth: int = 5) -> List[List[str]]:
        """BFS-based path finding through shell accounts."""
        valid_paths: List[List[str]] = []
        
        # BFS queue: (current_node, path, shell_count)
        queue: List[Tuple[str, List[str], int]] = [(start, [start], 0)]
        
        while queue and len(valid_paths) < 20:
            current, path, shell_count = queue.pop(0)
            
            if len(path) > max_depth:
                continue
            
            for neighbor in self.graph.successors(current):
                if neighbor in path:
                    continue
                
                new_path = path + [neighbor]
                new_shell_count = shell_count + (1 if neighbor in shell_candidates else 0)
                
                # Valid shell network path
                if len(new_path) >= min_length and new_shell_count >= 1:
                    intermediates = new_path[1:-1]
                    shell_intermediates = sum(1 for n in intermediates if n in shell_candidates)
                    
                    if shell_intermediates >= 1:
                        valid_paths.append(new_path)
                
                if len(new_path) < max_depth:
                    queue.append((neighbor, new_path, new_shell_count))
        
        return valid_paths
    
    def get_high_velocity_accounts(self, 
                                    time_window_hours: int = 24,
                                    threshold: int = 5) -> Dict[str, int]:
        """
        Detect accounts with high transaction velocity and amount variance.
        
        High velocity is suspicious only if:
        - Many small + many large transactions together (amount variance)
        - Repeated identical payments are NORMAL (not flagged)
        
        Args:
            time_window_hours: Time window to check (default 24 hours)
            threshold: Minimum transactions to flag (default 5)
            
        Returns:
            Dict mapping account_id to max transaction count in window
        """
        high_velocity: Dict[str, int] = {}
        
        if self.df.empty:
            return high_velocity
        
        df = self.df.copy()
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        all_accounts = set(df['sender_id'].unique()) | set(df['receiver_id'].unique())
        time_window = timedelta(hours=time_window_hours)
        
        for account in all_accounts:
            account_txs = df[
                (df['sender_id'] == account) | (df['receiver_id'] == account)
            ].sort_values('timestamp')
            
            if account_txs.empty:
                continue
            
            max_count, has_variance = self._analyze_velocity_with_variance(
                account_txs, time_window
            )
            
            # Only flag if high count AND meaningful amount variance
            # Repeated identical payments are normal business behavior
            if max_count >= threshold and has_variance:
                high_velocity[account] = max_count
        
        return high_velocity
    
    def _analyze_velocity_with_variance(self, df: pd.DataFrame, 
                                         time_window: timedelta) -> Tuple[int, bool]:
        """
        Analyze velocity with amount variance consideration.
        
        Returns:
            Tuple of (max_count, has_suspicious_variance)
            - has_suspicious_variance: True if mix of small and large amounts
        """
        if df.empty:
            return 0, False
        
        timestamps = df['timestamp'].sort_values().values
        amounts = df['amount'].values
        n = len(timestamps)
        max_count = 1
        best_window_amounts: List[float] = []
        left = 0
        
        for right in range(n):
            while left < right:
                time_diff = pd.Timestamp(timestamps[right]) - pd.Timestamp(timestamps[left])
                if time_diff > time_window:
                    left += 1
                else:
                    break
            
            current_count = right - left + 1
            if current_count > max_count:
                max_count = current_count
                best_window_amounts = list(amounts[left:right+1])
        
        # Check for suspicious amount variance
        # Many small + many large = suspicious (structuring behavior)
        # Repeated identical amounts = normal (regular payments)
        has_variance = False
        if len(best_window_amounts) >= 3:
            unique_amounts = set(round(a, 2) for a in best_window_amounts)
            
            # If most amounts are identical, it's normal business
            identical_ratio = len(best_window_amounts) / len(unique_amounts) if unique_amounts else 1
            if identical_ratio < 2:  # Many unique amounts
                # Check for mix of small and large
                avg_amt = sum(best_window_amounts) / len(best_window_amounts)
                if avg_amt > 0:
                    small_count = sum(1 for a in best_window_amounts if a < avg_amt * 0.5)
                    large_count = sum(1 for a in best_window_amounts if a > avg_amt * 1.5)
                    
                    # Suspicious if both small and large transactions present
                    if small_count >= 2 and large_count >= 1:
                        has_variance = True
                    elif len(unique_amounts) >= len(best_window_amounts) * 0.7:
                        # High variance in amounts (70%+ unique)
                        has_variance = True
        
        return max_count, has_variance
    
    def identify_merchant_patterns(self, cycle_participants: Optional[Set[str]] = None) -> Set[str]:
        """
        Identify likely merchant accounts using refined heuristics.
        
        A merchant has:
        - Very high fan-in
        - Low fan-out
        - Long transaction time span
        - No cycle participation
        
        Returns:
            Set of account IDs with merchant-like behavior
        """
        merchants: Set[str] = set()
        
        if cycle_participants is None:
            cycle_participants = set()
        
        if self.df.empty:
            return merchants
        
        df = self.df.copy()
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Calculate time span of dataset
        total_span = (df['timestamp'].max() - df['timestamp'].min()).days + 1
        
        # Analyze each account
        for receiver, group in df.groupby('receiver_id'):
            # Skip if account participates in cycles
            if receiver in cycle_participants:
                continue
            
            unique_senders = group['sender_id'].nunique()
            incoming_tx_count = len(group)
            
            # Check outgoing transactions
            outgoing_group = df[df['sender_id'] == receiver]
            outgoing_tx_count = len(outgoing_group)
            unique_receivers = outgoing_group['receiver_id'].nunique() if not outgoing_group.empty else 0
            
            # Calculate transaction time span for this account
            account_span = (group['timestamp'].max() - group['timestamp'].min()).days + 1
            
            # Merchant criteria:
            # - High fan-in (many unique senders, 10+)
            # - Low fan-out ratio (outgoing << incoming)
            # - Long time span (activity over multiple days)
            # - No cycle participation (already checked)
            
            fan_in_ratio = unique_senders / max(1, unique_receivers) if unique_receivers > 0 else unique_senders
            is_high_fan_in = unique_senders >= 10
            is_low_fan_out = outgoing_tx_count < incoming_tx_count * 0.3
            is_long_span = account_span >= min(7, total_span * 0.3)
            
            if is_high_fan_in and is_low_fan_out and is_long_span:
                merchants.add(receiver)
        
        return merchants
