/**
 * Home Page — warm editorial / human aesthetic
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

const PATTERNS = [
  {
    icon: '⟳',
    title: 'Circular Flows',
    desc: 'Detects 3–5 node round-trip patterns where funds return to origin — the fingerprint of layered laundering.',
  },
  {
    icon: '⇉',
    title: 'Fan-in / Fan-out',
    desc: 'Spots accounts that aggregate from 10+ sources or disperse to 10+ targets within 72-hour windows.',
  },
  {
    icon: '◈',
    title: 'Shell Structures',
    desc: 'Identifies low-degree intermediary accounts acting as pass-through nodes in layered shell networks.',
  },
];

function HomePage({ uploadStatus, setUploadStatus, error, setError, onAnalysisComplete }: HomePageProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) { setError('Please select a CSV file'); return; }
      if (!file.name.endsWith('.csv')) { setError('Only CSV files are supported'); return; }

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
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    disabled: uploadStatus === 'uploading' || uploadStatus === 'processing',
  });

  const isLoading = uploadStatus === 'uploading' || uploadStatus === 'processing';

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-fade-in">

      {/* Hero — editorial heading with drop cap feel */}
      <div className="mb-12">
        <p className="annotation mb-3" style={{ color: '#a09590' }}>
          Upload · Analyse · Detect
        </p>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: 700,
            color: 'var(--ink-900)',
            lineHeight: 1.15,
            maxWidth: '600px',
          }}
        >
          Find the patterns hidden in your{' '}
          <em style={{ color: 'var(--amber)', fontStyle: 'italic' }}>transaction data.</em>
        </h2>
        <p
          style={{
            fontFamily: "'Lora', serif",
            fontSize: '1rem',
            color: 'var(--ink-500)',
            marginTop: '1rem',
            maxWidth: '500px',
            lineHeight: 1.7,
          }}
        >
          Upload a CSV of financial transactions and our engine maps the graph,
          surfaces suspicious accounts, and identifies fraud ring structures automatically.
        </p>
      </div>

      {/* Upload zone */}
      <div className="card mb-6" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          {...getRootProps()}
          className={isDragActive ? 'dropzone-active' : ''}
          style={{
            border: '2px dashed',
            borderColor: isDragActive ? 'var(--amber)' : '#ddc9aa',
            borderRadius: '3px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            cursor: isLoading ? 'default' : 'pointer',
            transition: 'all 0.25s ease',
            background: isDragActive
              ? 'rgba(200, 135, 10, 0.04)'
              : 'rgba(253, 250, 245, 0.4)',
            opacity: isLoading ? 0.8 : 1,
          }}
        >
          <input {...getInputProps()} />

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <LoadingSpinner size="lg" />
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.125rem', color: 'var(--ink-900)' }}>
                {uploadStatus === 'uploading' ? 'Uploading file…' : 'Mapping transaction graph…'}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: 'var(--ink-500)' }}>
                Large datasets may take up to 30 seconds
              </p>
            </div>
          ) : (
            <>
              {/* Upload icon — hand-drawn feel */}
              <div style={{
                width: '56px',
                height: '56px',
                margin: '0 auto 1.25rem',
                background: 'rgba(200, 135, 10, 0.08)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(200, 135, 10, 0.2)',
              }}>
                <svg width="24" height="24" fill="none" stroke="var(--amber)" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>

              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink-900)', marginBottom: '0.375rem' }}>
                {isDragActive ? 'Drop it here' : 'Drop your CSV file here'}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: 'var(--ink-500)', marginBottom: '1.5rem' }}>
                or click to browse your computer
              </p>

              <button className="btn-primary">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Choose file
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="animate-fade-in"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            background: 'rgba(196, 74, 42, 0.06)',
            border: '1px solid rgba(196, 74, 42, 0.25)',
            borderRadius: '3px',
            borderLeft: '3px solid #c44a2a',
            marginBottom: '1.5rem',
          }}
        >
          <svg width="16" height="16" fill="none" stroke="#c44a2a" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#c44a2a' }}>
            {error}
          </span>
        </div>
      )}

      {/* Schema */}
      <div className="divider" />

      <div className="card-warm mb-8">
        <p className="annotation mb-3">Required CSV schema</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e0d4c4' }}>
                {['Column', 'Type', 'Example'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.5rem 1rem 0.5rem 0', color: '#a09590', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['transaction_id', 'String', 'TXN_001'],
                ['sender_id', 'String', 'ACC_00123'],
                ['receiver_id', 'String', 'ACC_00456'],
                ['amount', 'Float', '1500.00'],
                ['timestamp', 'DateTime', '2024-01-15 14:30:00'],
              ].map(([col, type, ex]) => (
                <tr key={col}>
                  <td style={{ padding: '0.5rem 1rem 0.5rem 0', color: 'var(--ink-900)' }}>{col}</td>
                  <td style={{ padding: '0.5rem 1rem 0.5rem 0', color: '#a09590' }}>{type}</td>
                  <td style={{ padding: '0.5rem 0', color: 'var(--ink-500)' }}>{ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detection patterns — editorial cards */}
      <div className="rule-text mb-6">What we look for</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {PATTERNS.map((p, i) => (
          <div
            key={p.title}
            className="card animate-fade-up"
            style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--amber)' }}>
              {p.icon}
            </div>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 600, color: 'var(--ink-900)', marginBottom: '0.5rem' }}>
              {p.title}
            </h4>
            <p style={{ fontFamily: "'Lora', serif", fontSize: '0.825rem', color: 'var(--ink-500)', lineHeight: 1.65 }}>
              {p.desc}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}

export default HomePage;