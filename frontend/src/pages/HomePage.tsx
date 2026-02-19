/**
 * Home Page Component
 * CSV upload with drag-and-drop support
 */

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { UploadStatus, AnalysisResponse } from '../types';
import { uploadFile } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface HomePageProps {
  uploadStatus: UploadStatus;
  setUploadStatus: (status: UploadStatus) => void;
  error: string | null;
  setError: (error: string | null) => void;
  onAnalysisComplete: (data: AnalysisResponse, sessionId: string) => void;
}

function HomePage({
  uploadStatus,
  setUploadStatus,
  error,
  setError,
  onAnalysisComplete,
}: HomePageProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      
      if (!file) {
        setError('Please select a CSV file');
        return;
      }

      if (!file.name.endsWith('.csv')) {
        setError('Only CSV files are supported');
        return;
      }

      setError(null);
      setUploadStatus('uploading');

      try {
        setUploadStatus('processing');
        const response = await uploadFile(file);

        if (response.success && response.data && response.sessionId) {
          onAnalysisComplete(response.data, response.sessionId);
        } else {
          setError(response.message || 'Analysis failed');
          setUploadStatus('error');
        }
      } catch (err) {
        setError((err as Error).message || 'Upload failed');
        setUploadStatus('error');
      }
    },
    [setError, setUploadStatus, onAnalysisComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: uploadStatus === 'uploading' || uploadStatus === 'processing',
  });

  const isLoading = uploadStatus === 'uploading' || uploadStatus === 'processing';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
          Detect Financial Crime Patterns
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Upload your transaction data to detect money muling, smurfing patterns, 
          and shell network structures using advanced graph analysis.
        </p>
      </div>

      {/* Upload Area */}
      <div className="card animate-slide-up">
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer
            ${isDragActive ? 'border-accent-primary bg-accent-primary/10' : 'border-dark-500 hover:border-accent-primary/50'}
            ${isLoading ? 'pointer-events-none opacity-75' : ''}
          `}
        >
          <input {...getInputProps()} />

          {isLoading ? (
            <div className="flex flex-col items-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-lg font-medium">
                {uploadStatus === 'uploading' ? 'Uploading...' : 'Analyzing transactions...'}
              </p>
              <p className="text-gray-400 mt-2">
                This may take up to 30 seconds for large datasets
              </p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-dark-700 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-accent-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <p className="text-xl font-medium mb-2">
                {isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file'}
              </p>
              <p className="text-gray-400 mb-4">or click to browse</p>

              <button className="btn-primary">Select File</button>
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-accent-danger/20 border border-accent-danger/50 rounded-lg text-accent-danger animate-fade-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          </div>
        )}
      </div>

      {/* CSV Schema Info */}
      <div className="mt-8 card animate-slide-up animation-delay-100">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Required CSV Format
        </h3>
        
        <div className="bg-dark-700 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-accent-primary">
                <th className="text-left py-2 pr-4">Column</th>
                <th className="text-left py-2 pr-4">Type</th>
                <th className="text-left py-2">Example</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr>
                <td className="py-1 pr-4">transaction_id</td>
                <td className="py-1 pr-4 text-gray-500">String</td>
                <td className="py-1">TXN_001</td>
              </tr>
              <tr>
                <td className="py-1 pr-4">sender_id</td>
                <td className="py-1 pr-4 text-gray-500">String</td>
                <td className="py-1">ACC_00123</td>
              </tr>
              <tr>
                <td className="py-1 pr-4">receiver_id</td>
                <td className="py-1 pr-4 text-gray-500">String</td>
                <td className="py-1">ACC_00456</td>
              </tr>
              <tr>
                <td className="py-1 pr-4">amount</td>
                <td className="py-1 pr-4 text-gray-500">Float</td>
                <td className="py-1">1500.00</td>
              </tr>
              <tr>
                <td className="py-1 pr-4">timestamp</td>
                <td className="py-1 pr-4 text-gray-500">DateTime</td>
                <td className="py-1">2024-01-15 14:30:00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          icon="🔄"
          title="Cycle Detection"
          description="Identifies circular fund routing patterns (3-5 nodes) indicating money laundering"
        />
        <FeatureCard
          icon="📊"
          title="Smurfing Detection"
          description="Detects fan-in/fan-out patterns within 72-hour windows"
        />
        <FeatureCard
          icon="🕸️"
          title="Shell Networks"
          description="Finds layered shell company structures with low-degree intermediaries"
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="card-hover animate-slide-up animation-delay-200">
      <div className="text-3xl mb-3">{icon}</div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

export default HomePage;
