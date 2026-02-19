/**
 * API Service for communicating with the backend.
 */

import axios, { AxiosError } from 'axios';
import type { ApiResponse, AnalysisResponse, FraudAnalysis } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second timeout for large files
});

/**
 * Upload CSV file for analysis
 */
export async function uploadFile(file: File): Promise<ApiResponse<AnalysisResponse>> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post<ApiResponse<AnalysisResponse>>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse>;
      throw new Error(axiosError.response?.data?.message || 'Failed to upload file');
    }
    throw error;
  }
}

/**
 * Get analysis by session ID
 */
export async function getAnalysis(sessionId: string): Promise<ApiResponse<AnalysisResponse>> {
  try {
    const response = await api.get<ApiResponse<AnalysisResponse>>(`/analysis/${sessionId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse>;
      throw new Error(axiosError.response?.data?.message || 'Failed to retrieve analysis');
    }
    throw error;
  }
}

/**
 * Download analysis as JSON file
 */
export async function downloadJSON(fraudAnalysis: FraudAnalysis): Promise<void> {
  const downloadData = {
    suspicious_accounts: fraudAnalysis.suspicious_accounts,
    fraud_rings: fraudAnalysis.fraud_rings,
    summary: fraudAnalysis.summary,
  };

  const blob = new Blob([JSON.stringify(downloadData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `fraud-analysis-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Health check for backend
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}
