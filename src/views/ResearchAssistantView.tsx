import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  FileText,
  Upload,
  BookOpen,
  Cpu,
  Download,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { IEEEReportButton } from '../components/IEEEReportButton';

interface AnalysisResult {
  abstract: string;
  methodology: string;
  equations: string[];
  insights: string[];
}

export default function ResearchAssistantView() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
      } else {
        setToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a valid PDF document.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else if (selectedFile) {
      setError('Please upload a valid PDF document.');
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`
        },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to analyze datasheet PDF.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during document parsing.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSummary = () => {
    if (!result || !file) return;

    const summaryContent = `======================================================================
AI ACADEMIC LITERATURE REVIEW SUMMARY
File: ${file.name}
Generated: ${new Date().toLocaleDateString()}
======================================================================

1. ABSTRACT
----------------------------------------------------------------------
${result.abstract}

2. CORE METHODOLOGY
----------------------------------------------------------------------
${result.methodology}

3. KEY MATHEMATICAL EQUATIONS / MODELS
----------------------------------------------------------------------
${result.equations.map((eq, i) => `[${i + 1}] ${eq}`).join('\n')}

4. ACTIONABLE INSIGHTS
----------------------------------------------------------------------
${result.insights.map((ins, i) => `- ${ins}`).join('\n')}

======================================================================
circuit-hub.com - AI Research Intelligence Assistant
======================================================================`;

    const blob = new Blob([summaryContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name.replace('.pdf', '')}_AI_Summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 font-sans text-slate-100 bg-navy-dark min-h-screen space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO TOOLS CATALOG
        </Link>
      </div>

      {/* Title */}
      <div className="border-b border-navy-light pb-6 mb-8">
        <h1 className="font-display text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-emerald-accent animate-pulse" />
          AI Literature Reviewer & Assistant
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Accelerate your EEE Capstone or Seminar studies (EEE 3200). Upload IEEE-style research papers and let Gemini extract abstracts, math models, and hardware methodology instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Column */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-navy-light bg-navy-card p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-white flex items-center gap-1.5">
              <Upload className="h-5 w-5 text-emerald-accent" />
              Document Upload
            </h3>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-48 ${
                isDragging
                  ? 'border-emerald-accent bg-emerald-accent/5'
                  : file
                  ? 'border-emerald-accent/50 bg-navy-dark/40 hover:border-emerald-accent'
                  : 'border-navy-light bg-navy-dark/40 hover:border-slate-500'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />
              <FileText className={`h-12 w-12 mb-3 transition-colors ${file ? 'text-emerald-accent' : 'text-slate-400'}`} />
              {file ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-white max-w-[200px] truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-slate-200">Drag & drop your PDF research paper</p>
                  <p className="text-slate-400">or click to browse local files</p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleUploadAndAnalyze}
              disabled={!file || loading}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                !file || loading
                  ? 'bg-navy-light text-slate-400 cursor-not-allowed border border-navy-light/60'
                  : 'bg-emerald-accent text-navy-dark hover:bg-emerald-hover shadow-emerald-accent/10'
              }`}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-navy-dark border-t-transparent rounded-full animate-spin" />
                  Analyzing Document...
                </>
              ) : (
                <>
                  Review Research Paper
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="rounded-2xl border border-navy-light/60 bg-navy-card/50 p-6 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5 text-emerald-accent" /> Why Literature Review matters?
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              In EEE Capstone (EEE 3200) and design project phases, review of past publications is standard. This tool simplifies model identification by isolating primary equations, removing complex markup delimiters, and displaying clean mathematical parameters.
            </p>
          </div>
        </div>

        {/* Results/Review Column */}
        <div className="lg:col-span-2">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Document Analysis Error</h4>
                <p className="text-xs text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* SKELETON LOADER SCREEN */}
          {loading && (
            <div className="rounded-2xl border border-navy-light bg-navy-card p-6 space-y-6 animate-pulse">
              <div className="h-6 bg-navy-light rounded-md w-1/3" />
              <div className="space-y-3">
                <div className="h-3 bg-navy-light rounded-md w-full" />
                <div className="h-3 bg-navy-light rounded-md w-5/6" />
                <div className="h-3 bg-navy-light rounded-md w-4/5" />
              </div>
              <hr className="border-navy-light/40" />
              <div className="h-6 bg-navy-light rounded-md w-1/4" />
              <div className="space-y-3">
                <div className="h-3 bg-navy-light rounded-md w-full" />
                <div className="h-3 bg-navy-light rounded-md w-2/3" />
              </div>
            </div>
          )}

          {/* STABLE EXTRACTION CARD OUTPUT */}
          {!loading && !result && !error && (
            <div className="rounded-2xl border border-navy-light bg-navy-card/40 p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-light/30 border border-navy-light mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-display font-bold text-white mb-1">Awaiting Research Document</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Upload your research paper, technical thesis, or component datasheet PDF to trigger AI structural intelligence extraction.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="rounded-2xl border border-navy-light bg-navy-card p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-navy-light pb-4" id="research-chart">
                <h3 className="font-display text-base font-bold text-white">
                  Academic Paper Analysis Result
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadSummary}
                    className="flex items-center gap-1 bg-emerald-accent/10 border border-emerald-accent/20 hover:bg-emerald-accent/25 text-emerald-accent rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Summary (.txt)
                  </button>
                  <IEEEReportButton
                    experimentName="Academic Research Assistant: Paper Analysis"
                    inputData={{
                      'Analyzed File': file?.name || 'Unknown'
                    }}
                    outputData={{
                      'Abstract Summary': result.abstract.substring(0, 50) + '...',
                      'Methodology Extract': result.methodology.substring(0, 50) + '...',
                      'Equations Found': result.equations?.length.toString() || '0',
                      'Insights Generated': result.insights?.length.toString() || '0'
                    }}
                    chartSelectors={['#research-chart']}
                  />
                </div>
              </div>

              {/* Tab 1: Abstract */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-accent uppercase tracking-wider">1. The Abstract Summary</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans bg-navy-dark/40 p-4 rounded-xl border border-navy-light/40">
                  {result.abstract}
                </p>
              </div>

              {/* Tab 2: Methodology */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-accent uppercase tracking-wider">2. Core Methodology & Architecture</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans bg-navy-dark/40 p-4 rounded-xl border border-navy-light/40">
                  {result.methodology}
                </p>
              </div>

              {/* Tab 3: Equations */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-accent uppercase tracking-wider">3. Extracted Mathematical Models</h4>
                <div className="bg-navy-dark/40 border border-navy-light/40 rounded-xl p-4 space-y-3 font-mono text-xs text-emerald-accent">
                  {result.equations && result.equations.length > 0 ? (
                    result.equations.map((eq, i) => (
                      <div key={i} className="flex gap-2 bg-navy-dark/80 p-2.5 rounded-lg border border-navy-light/40">
                        <span className="font-bold text-slate-500">[{i + 1}]</span>
                        <span className="break-all">{eq}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 font-sans italic">No notable mathematical formulas were found in the parsed document.</p>
                  )}
                </div>
              </div>

              {/* Tab 4: Insights */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-accent uppercase tracking-wider">4. Actionable Insights & Takeaways</h4>
                <div className="bg-navy-dark/40 border border-navy-light/40 rounded-xl p-4">
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {result.insights && result.insights.map((ins, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-emerald-accent font-bold">•</span>
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
