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
from typing import List, Dict, Set, Tuple
from datetime import timedelta
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
        """Build NetworkX directed graph from transactions."""
        G = nx.DiGraph()
        
        for tx in self.transactions:
            sender = tx["sender_id"]
            receiver = tx["receiver_id"]
            
            # Add nodes
            if not G.has_node(sender):
                G.add_node(sender)
            if not G.has_node(receiver):
                G.add_node(receiver)
            
            # Add edge with attributes
            G.add_edge(
                sender,
                receiver,
                amount=tx["amount"],
                timestamp=tx["timestamp"],
                transaction_id=tx["transaction_id"]
            )
        
        return G
    
    def run_all_detections(self) -> Dict:
        """
        Execute all detection algorithms and return comprehensive results.
        
        Returns:
            Dictionary containing all detected patterns
        """
        cycles = self.detect_cycles()
        fan_in, fan_out = self.detect_smurfing()
        shells = self.detect_shell_networks()
        high_velocity = self.get_high_velocity_accounts()
        merchants = self.identify_merchant_patterns()
        
        return {
            "cycles": cycles,
            "smurfing": {
                "fan_in": fan_in,
                "fan_out": fan_out
            },
            "shell_networks": shells,
            "high_velocity": high_velocity,
            "merchants": list(merchants)
        }
    
    def detect_cycles(self, min_length: int = 3, max_length: int = 5) -> List[List[str]]:
        """
        Detect circular fund routing patterns (money laundering).
        
        Uses Johnson's algorithm via nx.simple_cycles() with length filtering.
        Optimized by limiting max cycle length to 5.
        
        Args:
            min_length: Minimum cycle length (default 3)
            max_length: Maximum cycle length (default 5)
            
        Returns:
            List of cycles, each cycle is a list of account IDs
        """
        cycles = []
        
        try:
            # Use simple_cycles with length_bound for performance
            for cycle in nx.simple_cycles(self.graph, length_bound=max_length):
                if min_length <= len(cycle) <= max_length:
                    cycles.append(cycle)
                    
                # Limit to 100 cycles for performance
                if len(cycles) >= 100:
                    break
                    
        except nx.NetworkXError:
            pass
        
        return cycles
    
    def detect_smurfing(self, time_window_hours: int = 72, 
                        threshold: int = 10) -> Tuple[Dict[str, List[str]], Dict[str, List[str]]]:
        """
        Detect smurfing patterns (structuring).
        
        Fan-in: Multiple senders to single receiver within time window
        Fan-out: Single sender to multiple receivers within time window
        
        Args:
            time_window_hours: Time window in hours (default 72)
            threshold: Minimum unique counterparties to flag (default 10)
            
        Returns:
            Tuple of (fan_in_dict, fan_out_dict)
        """
        fan_in: Dict[str, List[str]] = {}
        fan_out: Dict[str, List[str]] = {}
        
        if self.df.empty:
            return fan_in, fan_out
        
        # Convert timestamp to datetime
        df = self.df.copy()
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        time_window = timedelta(hours=time_window_hours)
        
        # Detect Fan-In (multiple senders to one receiver)
        for receiver, group in df.groupby('receiver_id'):
            senders_in_window = self._get_unique_counterparties_in_window(
                group, 'sender_id', time_window
            )
            if len(senders_in_window) >= threshold:
                fan_in[receiver] = list(senders_in_window)
        
        # Detect Fan-Out (one sender to multiple receivers)
        for sender, group in df.groupby('sender_id'):
            receivers_in_window = self._get_unique_counterparties_in_window(
                group, 'receiver_id', time_window
            )
            if len(receivers_in_window) >= threshold:
                fan_out[sender] = list(receivers_in_window)
        
        return fan_in, fan_out
    
    def _get_unique_counterparties_in_window(self, group: pd.DataFrame, 
                                              counterparty_col: str,
                                              time_window: timedelta) -> Set[str]:
        """Get maximum unique counterparties within any time window."""
        if group.empty:
            return set()
        
        group = group.sort_values('timestamp')
        timestamps = group['timestamp'].values
        counterparties = group[counterparty_col].values
        
        max_unique: Set[str] = set()
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
        
        return max_unique
    
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
        Detect accounts with high transaction velocity.
        
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
            
            max_count = self._max_transactions_in_window(account_txs, time_window)
            
            if max_count >= threshold:
                high_velocity[account] = max_count
        
        return high_velocity
    
    def _max_transactions_in_window(self, df: pd.DataFrame, 
                                     time_window: timedelta) -> int:
        """Count maximum transactions within any time window."""
        if df.empty:
            return 0
        
        timestamps = df['timestamp'].sort_values().values
        n = len(timestamps)
        max_count = 1
        left = 0
        
        for right in range(n):
            while left < right:
                time_diff = pd.Timestamp(timestamps[right]) - pd.Timestamp(timestamps[left])
                if time_diff > time_window:
                    left += 1
                else:
                    break
            max_count = max(max_count, right - left + 1)
        
        return max_count
    
    def identify_merchant_patterns(self) -> Set[str]:
        """
        Identify likely merchant accounts (high consistent volume).
        
        Returns:
            Set of account IDs with merchant-like behavior
        """
        merchants: Set[str] = set()
        
        if self.df.empty:
            return merchants
        
        df = self.df.copy()
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Merchants: high incoming volume with many unique senders
        for receiver, group in df.groupby('receiver_id'):
            unique_senders = group['sender_id'].nunique()
            tx_count = len(group)
            
            if tx_count >= 20 and unique_senders >= 10:
                merchants.add(receiver)
        
        return merchants
